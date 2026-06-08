import {Router} from "express";
import { SuiteMasterGetResponse, UserProfile } from "@proto";
import { db } from "@db";
import { encrypt } from "@util/encrypt";
import { decrypt } from "@util/decrypt";
import fs from "fs";
import path from "path";
// @ts-ignore
import bzip2 from 'seek-bzip'

const router = Router({ mergeParams: true });

router.put('/', async(req, res) => {
    // @ts-ignore
    const userid = req.params.usrid
    const user = db.Users.find((u: any) => u.userId == userid)
    const master = SuiteMasterGetResponse.toJSON(SuiteMasterGetResponse.decode(bzip2.decode(decrypt(fs.readFileSync(`${path.join(process.cwd(), "resp", "suitemaster.bz2")}`)))))
    // @ts-ignore
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

    const userProfileDegree = {
        "first": {
            userId: userid,
            profileDegreeType: "first",
            degreeId: user.degree[0]
        }
    }
    // @ts-ignore
    if(user.degree[1]) userProfileDegree["second"] = {
        userId: userid,
        profileDegreeType: "second",
        degreeId: user.degree[1]
    }

    const data = {
        userName: user.userName,
        rank: user.rank,
        degree: 100,
        introduction: user.introduction,
        searchableFlg: true,
        publishUpdatedAtFlg: true,
        friendApplicableFlg: true,
        publishStageChallengeFriendRankingFlg: true,
        mainDeckUserSituations: {
            entries: situationIds.map(sid => {
                return userSituations.find((s: any) => s.situationId === sid);
            })
        },
        enabledUserAreaItems: {},
        bandRankMap: {
            entries: { 1:67, 2:67, 3:67, 4:67, 5:67, 18:67, 21:67, 45:67 }
        },
        userHighScoreRating: {
            userPoppinPartyHighScoreMusicList: {},
            userPastelPalettesHighScoreMusicList: {},
            userRoseliaHighScoreMusicList: {},
            userOtherHighScoreMusicList: {},
            userMorfonicaHighScoreMusicList: {},
            userRaiseASuilenHighScoreMusicList: {},
            userMyGOScoreMusicList: {}
        },
        mainUserDeck: user.decks[user.mainDeck - 1],
        userProfileSituation: {
        },
        userProfileDegreeMap: {
            entries: userProfileDegree
        },
        userTwitter: {},
        userDeckTotalRatingMap: {
            entries: {
                1: { rank: "c", score: 0, lowerRating: 1, upperRating: 1600000 },
                2: { rank: "c", score: 0, lowerRating: 1, upperRating: 1600000 },
                3: { rank: "c", score: 0, lowerRating: 1, upperRating: 1600000 },
                4: { rank: "c", score: 0, lowerRating: 1, upperRating: 1600000 },
                5: { rank: "c", score: 0, lowerRating: 1, upperRating: 1600000 },
                18: { rank: "c", score: 0, lowerRating: 1, upperRating: 1600000 },
                21: { rank: "c", score: 0, lowerRating: 1, upperRating: 1600000 },
                45: { rank: "c", score: 0, lowerRating: 1, upperRating: 1600000 },
            }
        },
        stageChallengeAchievementConditionsMap: {},
        userMusicClearInfoMap: computeMusicClearInfo(user.musicScore),
        userCharacterRankMap: {
            entries: (() => {
                const entries: Record<string, any> = {};
                for (let charId = 1; charId <= 40; charId++) {
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

    const message = UserProfile.fromJSON(data);
    const buffer = Buffer.from(UserProfile.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.send(encBuffer)
})

export default router;