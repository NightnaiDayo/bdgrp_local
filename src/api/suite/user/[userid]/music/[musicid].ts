import { Router } from "express";
import {SuiteUserMusic, UserMusicRequest, PlayerResourceList, SuiteMasterGetResponse} from "@proto";
import { decrypt } from "@util/decrypt";
import { saveDb, db } from "@db";
import { encrypt } from "@util/encrypt";
import fs from "fs";
import path from "path";
// @ts-ignore
import bzip2 from 'seek-bzip'

const router = Router({ mergeParams: true })

router.put('/', (req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    // @ts-ignore
    const musicid = req.params.musicid
    const user = db.Users.find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserMusicRequest.decode(reqbuffer)
    const master = SuiteMasterGetResponse.toJSON(SuiteMasterGetResponse.decode(bzip2.decode(decrypt(fs.readFileSync(`${path.join(process.cwd(), "resp", "suitemaster.bz2")}`)))))

    const musicKey = String(musicid);
    user.musicScore[musicKey] ??= { entries: [] };

    let target = user.musicScore[musicKey].entries.find((score: any) => score.musicDifficulty == decoded.musicDifficulty)

    const scoreInfo = {
        userId: userid,
        musicId: musicid,
        musicDifficulty: decoded.musicDifficulty,
        soloHighScore: decoded.score,
        maxCombo: decoded.combo,
        soloScoreRank: getScoreRank(decoded.score, getMusicInfo(Number(musicid), decoded.musicDifficulty)),
        clearStatus: decoded.clearStatus
    };

    if (!target) {
        user.musicScore[musicKey].entries.push(scoreInfo);
    } else {
        if (target.soloHighScore >= decoded.score) return;
        Object.assign(target, scoreInfo);
    }
    saveDb();

    const userSituations = Object.values(master.masterCharacterSituationMap.entries).map((card: any) => {
        const maxLevel = Math.max(...Object.keys(card.parameterMap || {}).map(Number));
        const hasTraining = card.rarity >= 3;
        return {
            userId: userid,
            situationId: Number(card.situationId),
            level: maxLevel,
            exp: 0,
            createdAt: Date.now(),
            addExp: 0,
            trainingStatus: hasTraining ? "done" : "not_doing",
            duplicateCount: 1,
            illust: hasTraining ? "after_training" : "normal",
            skillExp: 0,
            skillLevel: 5,
            userAppendParameter: hasTraining ? {
                userId: userid,
                situationId: Number(card.situationId),
                performance: card.training?.trainingPerformance,
                technique: card.training?.trainingTechnique,
                visual: card.training?.trainingVisual,
                characterPotentialPerformance: 30,
                characterPotentialTechnique: 30,
                characterPotentialVisual: 30,
                characterBonusPerformance: 30,
                characterBonusTechnique: 30,
                characterBonusVisual: 30
            } : undefined,
            limitBreakRank: 0
        };
    });


    const mainDeck = user.decks[user.mainDeck - 1];
    const situationIds = [mainDeck.leader, mainDeck.member1, mainDeck.member2, mainDeck.member3, mainDeck.member4].filter(Boolean);


    function computeMusicClearInfo(userMusicScore: any): Record<string, any> {
        const difficulties = ["easy", "normal", "hard", "expert", "special"];
        const stats: Record<string, { cleared: number; fullCombo: number; allPerfect: number }> = {};

        for (const diff of difficulties) {
            stats[diff] = { cleared: 0, fullCombo: 0, allPerfect: 0 };
        }

        for (const musicId in userMusicScore) {
            const entries = userMusicScore[musicId]?.entries;
            if (!entries) continue;
            for (const score of entries) {
                const diff = score.musicDifficulty;
                if (!stats[diff]) continue;
                stats[diff].cleared++;
                if (score.clearStatus === "full_combo") stats[diff].fullCombo++;
                if (score.clearStatus === "all_perfect") stats[diff].allPerfect++;
            }
        }

        const entries: Record<string, any> = {};
        for (const diff of difficulties) {
            entries[diff] = {
                // @ts-ignore
                clearedMusicCount: stats[diff].cleared,
                // @ts-ignore
                fullComboMusicCount: stats[diff].fullCombo,
                // @ts-ignore
                allPerfectMusicCount: stats[diff].allPerfect
            };
        }
        return { entries };
    }

    function computeMusicClearCountInfo(userMusicScore: any): Record<string, any> {
        const entries: Record<string, number> = {};
        for (const musicId in userMusicScore) {
            const scoreData = userMusicScore[musicId];
            const count = scoreData?.entries?.length || 0;
            if (count > 0) {
                entries[musicId] = count;
            }
        }
        return { entries };
    }

    function getMusicInfo(musicId: number, difficulty: string) {
        return master.masterMusicDifficultyList.entries.find(
            (entry: any) => entry.musicId === musicId && entry.difficulty === difficulty
        );
    }

    function getScoreRank(score: number, difficultyMaster: any): string {
        if (score >= difficultyMaster.scoreSS) return "ss";
        if (score >= difficultyMaster.scoreS) return "s";
        if (score >= difficultyMaster.scoreA) return "a";
        if (score >= difficultyMaster.scoreB) return "b";
        if (score >= difficultyMaster.scoreC) return "c";
        return "c";
    }

    const drops: PlayerResourceList[] = [
        { resourceType: "coin", quantity: 10000, lbBonus: 20 },
        { resourceId: 1, resourceType: "practice_ticket", quantity: 100, lbBonus: 20 },
        { resourceId: 2, resourceType: "item", quantity: 240, lbBonus: 20 },
        { resourceId: 1, resourceType: "item", quantity: 240, lbBonus: 20 },
        { resourceId: 3, resourceType: "item", quantity: 240, lbBonus: 20 },
        { resourceId: 8, resourceType: "item", quantity: 160, lbBonus: 20 },
        { resourceId: 7, resourceType: "item", quantity: 160, lbBonus: 20 },
        { resourceId: 8, resourceType: "item", quantity: 160, lbBonus: 20 }
    ]

    const characterIds = new Set<number>();
    for (const sid of situationIds) {
        const masterSit = master.masterCharacterSituationMap.entries[sid];
        if (masterSit && masterSit.characterId) {
            characterIds.add(masterSit.characterId);
        }
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
        drops: {
            entries: drops
        },
        newlyOpenedContents: {},
        userBandRankList: {
            entries: [
                {
                    userId: userid,
                    bandId: 5,
                    bandRank: 22,
                    exp: 8280,
                    addExp: 6000,
                    totalExp: 101880,
                    nextExp: 7520
                }
            ]
        },
        userSituationList: {
            entries: situationIds.map(sid => {
                return userSituations.find((s: any) => s.situationId === sid);
            })
        },
        achievementRewards: {},
        lbBonus: 20,
        lbUseCount: 10,
        soloScoreRank: getScoreRank(decoded.score, getMusicInfo(Number(musicid), decoded.musicDifficulty)),
        userMusicAchievementMap: {},
        missionLiveEventResponse: {},
        dairyLiveRewardReceive: "REWARDRECEIVE",
        limitedDrops: {},
        updatedBandDeckRankList: {
            entries: [
                {
                    bandId: 5,
                    beforeSymbol: "ss",
                    beforeLevel: 1,
                    afterSymbol: "ss",
                    afterLevel: 1
                }
            ]
        },
        livePoint: 114514,
        userCharacterRankMap: {
            entries: (() => {
                const entries: Record<string, any> = {};
                for (const charId of characterIds) {
                    entries[String(charId)] = {
                        rank: 100,
                        exp: 0,
                        addExp: 0,
                        nextExp: 0,
                        totalExp: 0,
                        releasedPotentialLevel: 50
                    };
                }
                return entries;
            })()
        }
    }

    const message = SuiteUserMusic.fromJSON(data);
    const buffer = Buffer.from(SuiteUserMusic.encode(message).finish());
    const encBuffer = encrypt(buffer)

    res.send(encBuffer)
})

export default router;