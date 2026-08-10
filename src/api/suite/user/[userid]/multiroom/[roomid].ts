import { Router } from "express";
import { SuiteUserMultiRoom, UserMultiRoomRequest, PlayerResourceList } from "@proto";
import { decrypt } from "@util/decrypt";
import { saveDb, db } from "@db";
import { encrypt } from "@util/encrypt";
import { getMaster } from "@master";
import { computeMusicClearInfo, computeMusicClearCountInfo, buildUserSituations, getScoreRank } from "@util/helpers";

const router = Router({ mergeParams: true })

const drops: PlayerResourceList[] = [
    { resourceType: "coin", quantity: 10000, lbBonus: 20 },
    { resourceId: 1, resourceType: "practice_ticket", quantity: 100, lbBonus: 20 },
    { resourceId: 2, resourceType: "item", quantity: 240, lbBonus: 20 },
    { resourceId: 1, resourceType: "item", quantity: 240, lbBonus: 20 },
    { resourceId: 3, resourceType: "item", quantity: 240, lbBonus: 20 },
    { resourceId: 8, resourceType: "item", quantity: 160, lbBonus: 20 },
    { resourceId: 7, resourceType: "item", quantity: 160, lbBonus: 20 },
    { resourceId: 8, resourceType: "item", quantity: 160, lbBonus: 20 }
];

function getMusicInfo(master: any, musicId: number, difficulty: string) {
    return master.masterMusicDifficultyList.entries.find(
        (entry: any) => entry.musicId === musicId && entry.difficulty === difficulty
    );
}

function getMultiScoreRank(score: number, difficultyMaster: any, multiLiveDifficultyId: number): string {
    const m = difficultyMaster?.multiLiveScoreMap?.[String(multiLiveDifficultyId)];
    if (!m) return "c";
    if (score >= m.scoreSS) return "ss";
    if (score >= m.scoreS) return "s";
    if (score >= m.scoreA) return "a";
    if (score >= m.scoreB) return "b";
    if (score >= m.scoreC) return "c";
    return "c";
}

router.post('/', (req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    // @ts-ignore
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserMultiRoomRequest.decode(reqbuffer)
    const musicid = decoded.musicId
    const master = getMaster();

    const musicKey = String(musicid);
    user.musicScore[musicKey] ??= { entries: [] };

    let target = user.musicScore[musicKey].entries.find((score: any) => score.musicDifficulty == decoded.musicDifficulty)

    const difficultyMaster = getMusicInfo(master, Number(musicid), decoded.musicDifficulty);
    const scoreInfo = {
        userId: userid,
        musicId: musicid,
        musicDifficulty: decoded.musicDifficulty,
        soloHighScore: decoded.score,
        maxCombo: decoded.combo,
        soloScoreRank: getScoreRank(decoded.score, difficultyMaster),
        clearStatus: decoded.clearStatus
    };

    if (!target) {
        user.musicScore[musicKey].entries.push(scoreInfo);
    } else {
        if (target.soloHighScore >= decoded.score) return;
        Object.assign(target, scoreInfo);
    }
    saveDb();

    const userSituations = buildUserSituations(userid, master);
    const mainDeck = user.decks[user.mainDeck - 1];
    const situationIds = [mainDeck.leader, mainDeck.member1, mainDeck.member2, mainDeck.member3, mainDeck.member4].filter(Boolean);

    const characterIds = new Set<number>();
    for (const sid of situationIds) {
        const masterSit = master.masterCharacterSituationMap.entries[sid];
        if (masterSit?.characterId) characterIds.add(masterSit.characterId);
    }

    const data = {
        updateResources: {
            userMusicScoreMap: {
                entries: Object.fromEntries(
                    Object.entries(user.musicScore).map(([musicId, scoreData]) => [
                        musicId,
                        {
                            entries: scoreData.entries.map((score: any) => ({
                                userId: String(user.userId),
                                musicId: Number(musicId),
                                musicDifficulty: score.musicDifficulty,
                                soloHighScore: score.soloHighScore,
                                maxCombo: score.maxCombo,
                                soloScoreRank: score.soloScoreRank,
                                clearStatus: score.clearStatus
                            }))
                        }
                    ])
                )
            },
            userMusicClearInfoMap: computeMusicClearInfo(user.musicScore),
            userMusicClearCountInfoMap: computeMusicClearCountInfo(user.musicScore)
        },
        drops: { entries: drops },
        newlyOpenedContents: {},
        userBandRankList: {
            entries: [{
                userId: userid, bandId: 5, bandRank: 22,
                exp: 8280, addExp: 6000, totalExp: 101880, nextExp: 7520
            }]
        },
        userSituationList: {
            entries: situationIds.map(sid => userSituations.find((s: any) => s.situationId === sid))
        },
        achievementRewards: {},
        lbBonus: 20,
        lbUseCount: 10,
        soloScoreRank: getScoreRank(decoded.score, difficultyMaster),
        multiScoreRank: getMultiScoreRank(decoded.multiScore, difficultyMaster, decoded.multiDifficulty),
        userMusicAchievementMap: {},
        dairyLiveRewardReceive: "REWARDRECEIVE",
        limitedDrops: {},
        updatedBandDeckRankList: {
            entries: [{
                bandId: 5, beforeSymbol: "ss", beforeLevel: 1, afterSymbol: "ss", afterLevel: 1
            }]
        },
        livePoint: 114514,
        userCharacterRankMap: {
            entries: Object.fromEntries(
                [...characterIds].map(charId => [String(charId), {
                    rank: 100, exp: 0, addExp: 0, nextExp: 0, totalExp: 0, releasedPotentialLevel: 50
                }])
            )
        }
    }

    const message = SuiteUserMultiRoom.fromJSON(data);
    const buffer = Buffer.from(SuiteUserMultiRoom.encode(message).finish());
    const encBuffer = encrypt(buffer)

    res.send(encBuffer)
})

export default router;