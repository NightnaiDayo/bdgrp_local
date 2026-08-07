import { Router } from "express";
import { encrypt } from "@util/encrypt";
import { db, saveDb } from "@db";
import { SuiteUserGetResponse, SuiteMasterGetResponse } from "@proto"
import { getMaster } from "@master";
import fs from "fs";
import path from "path";

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    //@ts-ignore
    const userid = req.params.userid

    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);

    const master = getMaster();

    if (!user) return res.status(404).send();

    const storyList = (storyMap: any) => ({
        entries: Object.values(storyMap.entries).map((story: any) => ({
            userId: userid,
            bandStoryId: story.bandStoryId,
            bandId: story.bandId,
            status: "already_read",
            seq: story.seq
        }))
    });

    const userCharacterMap: Record<string, any> = {};
    let userDeckList;
    
    for(let i = 1; i <=40; i++) {
        userCharacterMap[String(i)] = {
            userId: Number(userid),
            characterId: i,
            costumeId: user.wearingCostume ? user.wearingCostume[String(i)].costumeId : i >= 36 ? (1786 + (i - 36)) : (1607 + i)
        }
    }
    userCharacterMap["601"] = {
        userId: Number(userid),
        characterId: 601,
        costumeId: user.wearingCostume ? user.wearingCostume["601"].costumeId : 1643
    }
    const userSituations = Object.values(master.masterCharacterSituationMap.entries)
        .filter((card: any) => card.releasedAt !== "4128645600000" && card.releasedAt !== "4131237600000")
        .map((card: any) => {
        const maxLevel = Math.max(...Object.keys(card.parameterMap || {}).map(Number));
        const hasTraining = card.rarity >= 3;
        if(!user.situationIllust) user.situationIllust = {}
        saveDb()
        return {
            userId: userid,
            situationId: Number(card.situationId),
            level: maxLevel,
            exp: 0,
            createdAt: card.releasedAt,
            addExp: 0,
            trainingStatus: hasTraining ? "done" : "not_doing",
            duplicateCount: 0,
            illust: user.situationIllust[card.situationId] ?? (hasTraining ? "after_training" : "normal"),
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
            limitBreakRank: 4
        };
    });

    if(!user.decks) {
        userDeckList = [
            {
                deckId: 1,
                deckName: process.env.SERVER === "TW" ? "樂團1" : "バンド1",
                leader: 947,
                member1: 1765,
                member2: 1730,
                member3: 2193,
                member4: 2018,
                deckType: "normal"
            }
        ]

        user.decks = userDeckList

        saveDb();
    } else {
        userDeckList = user.decks
    }
    if(!user.musicScore) {
        user.musicScore = {}
        saveDb();
    }
    if(!user.wearingCostume) {
        user.wearingCostume = Object.fromEntries(
            [...Array.from({length: 40}, (_, i) => i + 1), 601].map(charId => {
                const defaults: Record<number, {dressId: number, hairstyleId: number, costumeId: number}> = {
                    36: { dressId: 12854, hairstyleId: 502, costumeId: 1786 },
                    37: { dressId: 12855, hairstyleId: 503, costumeId: 1787 },
                    38: { dressId: 12856, hairstyleId: 504, costumeId: 1788 },
                    39: { dressId: 12857, hairstyleId: 505, costumeId: 1789 },
                    40: { dressId: 12858, hairstyleId: 506, costumeId: 1790 },
                    601: { dressId: 36, hairstyleId: 36, costumeId: 1643 },
                };
                return [
                    String(charId),
                    defaults[charId] ?? { dressId: charId, hairstyleId: charId, costumeId: 1332+charId }
                ];
            })
        );
        saveDb();
    }

    const DECO_MOTION_MAP: Record<number, number[]> = {
        1: [217, 218, 219], 2: [222, 223, 224], 3: [227, 228, 229],
        4: [232, 233, 234], 5: [237, 238, 239], 6: [242, 243, 244],
        7: [247, 248, 249], 8: [252, 253, 254], 9: [257, 258, 259],
        10: [262, 263, 264], 11: [267, 268, 269], 12: [272, 273, 274],
        13: [277, 278, 279], 14: [282, 283, 284], 15: [287, 288, 289],
        16: [292, 293, 294], 17: [297, 298, 299], 18: [302, 303, 304],
        19: [307, 308, 309], 20: [312, 313, 314], 21: [317, 318, 319],
        22: [322, 323, 324], 23: [327, 328, 329], 24: [332, 333, 334],
        25: [337, 338, 339], 26: [342, 343, 344], 27: [347, 348, 349],
        28: [352, 353, 354], 29: [357, 358, 359], 30: [362, 363, 364],
        31: [367, 368, 369], 32: [372, 373, 374], 33: [377, 378, 379],
        34: [382, 383, 384], 35: [387, 388, 389], 36: [462, 463, 464],
        37: [467, 468, 469], 38: [472, 473, 474], 39: [477, 478, 479],
        40: [482, 483, 484], 601: [392, 393, 394]
    };

    const mainDeck = user.decks[user.mainDeck - 1];
    const situationIds = [mainDeck.leader, mainDeck.member1, mainDeck.member2, mainDeck.member3, mainDeck.member4].filter(Boolean);
    const deckMembers = [...new Set(
        // @ts-ignore
        situationIds.map(sid => master.masterCharacterSituationMap.entries[String(sid)]?.characterId).filter(Boolean)
    )];

    const commonsLive2d: Record<string, Record<number, number[]>> = {};
    for (const entry of Object.values(master.masterCommonsLive2dMap.entries) as any[]) {
        const category = entry.live2dCategory;
        const charId = entry.characterId;
        if (!commonsLive2d[category]) commonsLive2d[category] = {};
        if (!commonsLive2d[category][charId]) commonsLive2d[category][charId] = [];
        commonsLive2d[category][charId].push(entry.live2dId);
    }

    const aggregated: Record<string, number[]> = {};

    for (const [category, charMap] of Object.entries(commonsLive2d)) {
        for (const [charId, ids] of Object.entries(charMap)) {
            if (deckMembers.includes(Number(charId))) {
                if (!aggregated[category]) aggregated[category] = [];
                aggregated[category].push(...ids);  // 這裡的展開是安全的，ids 是陣列
            }
        }
    }

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

    const userProfileDegree = {
        "first": {
            userId: Number(userid),
            profileDegreeType: "first",
            degreeId: user.degree[0]
        }
    }
    // @ts-ignore
    if(user.degree[1]) userProfileDegree["second"] = {
        userId: Number(userid),
        profileDegreeType: "second",
        degreeId: user.degree[1]
    }

    const characterProfileL2d: Record<number, number[]> = {};
    for (const entry of Object.values(master.masterCharacterProfileLive2dMap.entries) as any[]) {
        if (!characterProfileL2d[entry.characterId]) {
            characterProfileL2d[entry.characterId] = [];
        }
        characterProfileL2d[entry.characterId].push(entry.characterProfileLive2dId);
    }

    if(!user.decos) {
        user.decos = {}
        saveDb();
    }

    const masterPurchaseMap = master.masterPurchaseMap?.entries || {};
    const purchaseIds = Object.keys(masterPurchaseMap)

    const userEpisodeMap: Record<string, any> = {};
    for (const situation of Object.values(master.masterCharacterSituationMap.entries) as any[]) {
        if (situation.releasedAt === "4128645600000" || situation.releasedAt === "4131237600000") continue;
        if (!situation.episodes?.entries) continue;
        for (const episode of situation.episodes.entries) {
            userEpisodeMap[String(episode.episodeId)] = {
                userId: Number(userid),
                episodeId: episode.episodeId,
                episodeStatus: "already_read"
            };
        }
    }

    const past = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pastEvents", `${process.env.SERVER}.json`), 'utf-8'));
    
    // @ts-ignore
    const data = {
        user: {
            userRegistration: {
                userId: String(user.userId),
                hash: user.hash,
                userName: user.userName,
                clientVersion: user.clientVersion ?? '',
                platform: user.platform ?? '',
                deviceModel: user.deviceModel ?? '',
                operatingSystem: user.operatingSystem ?? '',
                birthMonth: user.birthMonth,
                tutorialStatus: user.tutorialStatus,
                introduction: user.introduction,
                tutorialEndedAt: user.tutorialEndedAt.toString()
            },
            userGamedata: {
                userId: String(user.userId),
                rank: user.rank,
                exp: user.exp,
                coin: String(user.coin),
                mainDeck: user.mainDeck,
                paidStar: user.paidStar,
                freeStar: user.freeStar,
                seal: user.seal,
                degree: user.degree[0],
                publishTotalDeckPowerFlg: user.publishTotalDeckPowerFlg,
                publishBandRankFlg: user.publishBandRankFlg,
                publishMusicClearedFlg: user.publishMusicClearedFlg,
                publishMusicFullComboFlg: user.publishMusicFullComboFlg,
                publishHighScoreRatingFlg: user.publishHighScoreRatingFlg,
                pooledExp: String(user.pooledExp),
                totalExp: String(user.totalExp),
                nextExp: user.nextExp,
                publishUpdatedAtFlg: user.publishUpdatedAtFlg,
                userPaidStarRecallResponse: undefined,
                startDashLoginBonusReceiveFlg: user.startDashLoginBonusReceiveFlg,
                publishMusicAllPerfectFlg: user.publishMusicAllPerfectFlg,
                publishDeckRankFlg: user.publishDeckRankFlg,
                publishStageAchievementConditionsFlg: user.publishStageAchievementConditionsFlg,
                publishStageFriendRankingFlg: user.publishStageFriendRankingFlg,
                publishCharacterRankFlg: user.publishCharacterRankFlg,
                loginDays: user.loginDays
            }
        },
        userCharacterMap: {
            entries: userCharacterMap
        },
        userSituationMap: {
            entries: Object.fromEntries(
                userSituations.map((sit: any) => [sit.situationId, sit])
            )
        },
        userMainStoryList: {
            entries: Object.values(master.masterMainStoryMap.entries).map((story: any) => ({
                userId: userid,
                storyId: story.mainStoryId,
                status: "already_read"
            })).reverse()
        },
        userPracticeTicketList: undefined,
        userBondsList: {
            entries: [
                {
                    userId: userid,
                    bondsId: 1,
                    level: 1,
                    bonds: 10
                },
                {
                    userId: userid,
                    bondsId: 2,
                    level: 1,
                    bonds: 15
                },
                {
                    userId: userid,
                    bondsId: 3,
                    level: 1,
                    bonds: 20
                },
                {
                    userId: userid,
                    bondsId: 4,
                    level: 1,
                    bonds: 25
                },
                {
                    userId: userid,
                    bondsId: 5,
                    level: 1,
                    bonds: 30
                },
                {
                    userId: userid,
                    bondsId: 6,
                    level: 1,
                    bonds: 35
                },
                {
                    userId: userid,
                    bondsId: 7,
                    level: 1,
                    bonds: 40
                },
                {
                    userId: userid,
                    bondsId: 8,
                    level: 1,
                    bonds: 45
                },
                {
                    userId: userid,
                    bondsId: 9,
                    level: 1,
                    bonds: 50
                },

            ]
        },
        userBandRankMap: {
            entries: {
                "1": { userId: userid, bandId: 1, bandRank: 50, exp: 0, totalExp: 0, nextExp: 0 },
                "2": { userId: userid, bandId: 2, bandRank: 50, exp: 0, totalExp: 0, nextExp: 0 },
                "3": { userId: userid, bandId: 3, bandRank: 50, exp: 0, totalExp: 0, nextExp: 0 },
                "4": { userId: userid, bandId: 4, bandRank: 50, exp: 0, totalExp: 0, nextExp: 0 },
                "5": { userId: userid, bandId: 5, bandRank: 50, exp: 0, totalExp: 0, nextExp: 0 },
                "18": { userId: userid, bandId: 18, bandRank: 50, exp: 0, totalExp: 0, nextExp: 0 },
                "21": { userId: userid, bandId: 21, bandRank: 50, exp: 0, totalExp: 0, nextExp: 0 },
                "45": { userId: userid, bandId: 45, bandRank: 50, exp: 0, totalExp: 0, nextExp: 0 }
            }
        },
        userPoppinPartyStoryList: storyList(master.masterPoppinPartyStoryMap),
        userAfterglowStoryList: storyList(master.masterAfterglowStoryMap),
        userPastelPalettesStoryList: storyList(master.masterPastelPalettesStoryMap),
        userHelloHappyWorldStoryList: storyList(master.masterHelloHappyWorldStoryMap),
        userRoseliaStoryList: storyList(master.masterRoseliaStoryMap),
        userItemList: {
            entries: Object.values(master.masterItemMap.entries).map((item: any) => ({
                userId: userid,
                itemId: item.itemId,
                quantity: 6767
            }))
        },
        userCommonsLive2dMap: {
            entries: Object.fromEntries(
                Object.entries(aggregated).map(([category, idArray]) => [
                    String(category),
                    {
                        entries: idArray.map(live2dId => ({
                            live2dId,
                            live2dCategory: category
                        }))
                    }
                ])
            )
        },
        userEpisodeMap: {
            entries: userEpisodeMap
        },
        userMusicInventoryList: {
            entries: master.masterMusicList.entries.map((song: any) => {
                const musicId = song.musicId;
                const hasMv = !!master.masterMusicVideoListMap.entries[String(musicId)];
                return {
                    userId: userid,
                    musicId: musicId,
                    seq: 1,
                    hasMv: hasMv,
                    createdAt: Date.now().toString()
                };
            })
        },
        userCostumeMap: {
            // @ts-ignore
            entries: Object.fromEntries(
                Object.values(master.masterCostumeMap.entries).map(costume => [
                    String(costume.costumeId),
                    {
                        userId: userid,
                        costumeId: costume.costumeId,
                        characterId: costume.characterId
                    }
                ])
            )
        },
        userAfterLiveTalkListMap: undefined,
        userAreaItemMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterAreaItemMap.entries).map(([id, areaItem]) => [
                    id,
                    {
                        userId: userid,
                        areaItemId: areaItem.areaItemId,
                        areaItemCategory: areaItem.categoryId,
                        level: 8
                    }
                ])
            ),
            newlyOpenedContents: { entries: [] }
        },
        userResourceCount: undefined,
        userLiveBoost: {
            userId: userid,
            liveBoost: 114,
            serverDate: Date.now().toString(),
            liveBoostBonusType: "default"
        },
        userExchangesList: {
            entries: [
                {
                    userId: 8374399,
                    exchangesId: 1563,
                    resetAt: "1779155725000"
                }
            ]
        },
        userGachaTicketList: undefined,
        userGachaStatusMap: undefined,
        userAreaStatusMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterAreaMap.entries)
                    .filter(([_, area]) => area.areaType === "common")
                    .map(([areaId]) => [
                        Number(areaId),
                        {userId: userid, areaId: Number(areaId)}
                    ])
            )
        },
        userLoginBonusMap: { entries: {} },
        userHomeBannerList: undefined,
        userStampMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterStampMap.entries).map(([stampId, stamp]) => [
                    Number(stampId), // 保持字串作為物件的鍵
                    {
                        userId: userid,
                        stampId: Number(stampId),
                        seq: 1,
                        isUnlockVoice: !!stamp.withVoice // PS全解鎖：或者直接給 true 也行
                    }
                ])
            )
        },
        userDegreeMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterDegreeMap.entries).map((degreeId) => [
                    Number(degreeId),
                    { userId: userid, degreeId: Number(degreeId) }
                ])
            )
        },
        userBadPenalty: undefined,
        userCharacterProfileLive2dMap: {
            entries: Object.fromEntries(
                Object.entries(characterProfileL2d).map(([charId, ids]) => [
                    charId,
                    {
                        entries: ids.map(id => ({
                            characterId: Number(charId),
                            live2dId: id
                        }))
                    }
                ])
            )
        },
        userEventExchangesList: { entries: [] },
        userEventItemList: {
            entries: Object.entries(master.masterEventItemMap.entries).map((item) => [
                {
                    userId: userid,
                    eventItemId: item.eventItemId,
                    quantity: 1
                }
            ])
        },
        userPurchaseMap: {
            entries: Object.fromEntries(
                purchaseIds.map(id => [
                    Number(id),
                    { userId: userid, purchaseId: Number(id), count: 0 }
                ])
            )
        },
        userMissionMap: {
            entries: {
                "2": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 2,
                            "seq": 1,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "6": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 6,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "8": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 8,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "9": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 9,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "11": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 11,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "12": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 12,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "14": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 14,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "22": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 22,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "23": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 23,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "24": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 24,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "25": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 25,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "26": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 26,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "27": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 27,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "28": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 28,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "29": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 29,
                            "seq": 1,
                            "progress": 89219,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "30": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 30,
                            "seq": 1,
                            "progress": 32572,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "31": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 31,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "32": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 32,
                            "seq": 1,
                            "progress": 262272,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "33": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 33,
                            "seq": 1,
                            "progress": 50313,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "34": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 34,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "35": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 35,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "50": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 50,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "66": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 66,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "67": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 67,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 101
                        }
                    ]
                },
                "1001": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1001,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1002": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1002,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1003": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1003,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1004": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1004,
                            "seq": 1,
                            "progress": 2,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1005": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1005,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1006": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1006,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1007": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1007,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1008": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1008,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1009": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1009,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1010": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1010,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1011": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1011,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1012": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1012,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1013": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1013,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1014": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1014,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1015": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1015,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1016": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1016,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1017": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1017,
                            "seq": 1,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 201
                        },
                        {
                            "userId": userid,
                            "missionId": 1017,
                            "seq": 2,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1018": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1018,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1019": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1019,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1020": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1020,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1021": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1021,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1022": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1022,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1023": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1023,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1024": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1024,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1025": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1025,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1026": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1026,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1027": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1027,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1028": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1028,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1029": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1029,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1030": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1030,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1031": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1031,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1032": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1032,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1033": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1033,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1034": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1034,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1035": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1035,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1106": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1106,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1107": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1107,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1108": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1108,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1109": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1109,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1110": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1110,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 201
                        }
                    ]
                },
                "1111": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1111,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1112": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1112,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1113": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1113,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1114": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1114,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1115": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1115,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1801": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1801,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1802": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1802,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1803": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1803,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1804": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1804,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1805": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1805,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1806": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1806,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1807": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1807,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1808": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1808,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1809": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1809,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1810": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1810,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1811": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1811,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1812": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1812,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1813": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1813,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1814": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1814,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1815": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1815,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1816": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1816,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1817": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1817,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1818": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1818,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1819": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1819,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1820": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1820,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1821": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1821,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1822": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1822,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1823": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1823,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1824": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1824,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1825": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1825,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1826": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1826,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1827": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1827,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1828": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1828,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1829": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1829,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1830": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1830,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1831": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1831,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1832": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1832,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1833": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1833,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1834": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1834,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "1835": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 1835,
                            "seq": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 281
                        }
                    ]
                },
                "10000341": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 10000341,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 544
                        }
                    ]
                },
                "10000342": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 10000342,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "end",
                            "missionGroupId": 544
                        }
                    ]
                },
                "10000346": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 10000346,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 544
                        }
                    ]
                },
                "310000001": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000001,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000001,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000002": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000002,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000002,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000003": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000003,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000003,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000004": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000004,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000004,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000004,
                            "seq": 3,
                            "progress": 2,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000005": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000005,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000005,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000006": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000006,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000006,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000013": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000013,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000013,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000014": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000014,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000014,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000021": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000021,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000021,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000022": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000022,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000022,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000022,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000022,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000023": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000023,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000023,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000025": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000025,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000025,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000041": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000041,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000041,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000041,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000041,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000042": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000042,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000042,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000042,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000042,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000043": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000043,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000043,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000043,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000043,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000044": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000044,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000044,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000044,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000044,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000045": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000045,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000045,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000045,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000045,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000046": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000046,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000046,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000046,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000046,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000047": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000047,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000047,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000047,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000047,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000048": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000048,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000048,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000048,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000048,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000049": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000049,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000049,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000049,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000049,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000050": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000050,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000050,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000050,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000050,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000051": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000051,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000051,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000051,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000051,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000052": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000052,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000052,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000052,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000052,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000053": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000053,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000053,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000053,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000053,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000054": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000054,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000054,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000054,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000054,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000055": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000055,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000055,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000055,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000055,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000055,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000055,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000055,
                            "seq": 7,
                            "progress": 6,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000056": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000056,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000056,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000056,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000056,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000057": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000057,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000057,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000057,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000057,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000058": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000058,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000058,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000058,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000058,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000059": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000059,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000059,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000059,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000059,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000060": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000060,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000060,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000060,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000060,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000061": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000061,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000061,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000061,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000061,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000062": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000062,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000062,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000062,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000062,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000062,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000062,
                            "seq": 6,
                            "progress": 5,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000063": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000063,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000063,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000063,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000063,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000064": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000064,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000064,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000064,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000064,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000065": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000065,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000065,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000065,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000065,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000066": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000066,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000066,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000066,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000066,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000067": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000067,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000067,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000067,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000067,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000068": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000068,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000068,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000068,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000068,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000069": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000069,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000069,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000069,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000069,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000070": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000070,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000070,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000070,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000070,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000071": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000071,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000071,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000071,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000071,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000072": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000072,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000072,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000072,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000072,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000073": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000073,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000073,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000073,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000073,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000074": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000074,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000074,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000074,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000074,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000075": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000075,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000075,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000075,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000075,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000076": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000076,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000076,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000076,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000076,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000077": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000077,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000077,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000077,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000077,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000078": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000078,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000078,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000078,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000078,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000079": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000079,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000079,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000079,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000079,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000080": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000080,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000080,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000080,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000080,
                            "seq": 4,
                            "progress": 3,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000081": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000081,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000081,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000081,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000081,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000081,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000081,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000081,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000081,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000082": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000082,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000082,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000082,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000082,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000082,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000082,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000082,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000082,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000083": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000083,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000083,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000083,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000083,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000083,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000083,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000083,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000083,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000084": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000084,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000084,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000084,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000084,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000084,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000084,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000084,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000084,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000085": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000085,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000085,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000085,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000085,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000085,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000085,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000085,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000085,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000086": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000086,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000086,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000086,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000086,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000086,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000086,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000086,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000086,
                            "seq": 8,
                            "progress": 8,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000086,
                            "seq": 9,
                            "progress": 9,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000086,
                            "seq": 10,
                            "progress": 9,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000087": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000087,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000087,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000087,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000087,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000087,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000087,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000087,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000087,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000088": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000088,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000088,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000088,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000088,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000088,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000088,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000088,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000088,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000089": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000089,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000089,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000089,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000089,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000089,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000089,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000089,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000089,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000090": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000090,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000090,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000090,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000090,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000090,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000090,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000090,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000090,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000091": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000091,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000091,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000091,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000091,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000091,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000091,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000091,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000091,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000092": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000092,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000092,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000092,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000092,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000092,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000092,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000092,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000092,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000093": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000093,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000093,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000093,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000093,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000093,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000093,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000093,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000093,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000094": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000094,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000094,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000094,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000094,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000094,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000094,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000094,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000094,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000095": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000095,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000095,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000095,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000095,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000095,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000095,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000095,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000095,
                            "seq": 8,
                            "progress": 8,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000095,
                            "seq": 9,
                            "progress": 9,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000095,
                            "seq": 10,
                            "progress": 9,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000096": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000096,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000096,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000096,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000096,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000096,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000096,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000096,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000096,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000097": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000097,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000097,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000097,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000097,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000097,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000097,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000097,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000097,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000098": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000098,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000098,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000098,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000098,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000098,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000098,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000098,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000098,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000099": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000099,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000099,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000099,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000099,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000099,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000099,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000099,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000099,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000100": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000100,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000100,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000100,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000100,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000100,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000100,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000100,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000100,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000101": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000101,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000101,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000101,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000101,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000101,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000101,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000101,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000101,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000102": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000102,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000102,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000102,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000102,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000102,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000102,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000102,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000102,
                            "seq": 8,
                            "progress": 8,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000102,
                            "seq": 9,
                            "progress": 9,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000102,
                            "seq": 10,
                            "progress": 9,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000103": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000103,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000103,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000103,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000103,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000103,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000103,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000103,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000103,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000104": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000104,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000104,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000104,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000104,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000104,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000104,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000104,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000104,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000105": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000105,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000105,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000105,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000105,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000105,
                            "seq": 5,
                            "progress": 5,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000105,
                            "seq": 6,
                            "progress": 6,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000105,
                            "seq": 7,
                            "progress": 7,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000105,
                            "seq": 8,
                            "progress": 7,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000106": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000106,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000106,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000106,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000106,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000106,
                            "seq": 5,
                            "progress": 4,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000107": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000107,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000107,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000107,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000107,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000107,
                            "seq": 5,
                            "progress": 4,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000108": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000108,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000108,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000108,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000108,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000108,
                            "seq": 5,
                            "progress": 4,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000109": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000109,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000109,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000109,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000109,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000109,
                            "seq": 5,
                            "progress": 4,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000110": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000110,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000110,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000110,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000110,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000110,
                            "seq": 5,
                            "progress": 4,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000111": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000111,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000111,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000111,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000111,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000111,
                            "seq": 5,
                            "progress": 4,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000112": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000112,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000112,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000112,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000112,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000112,
                            "seq": 5,
                            "progress": 4,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000113": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000113,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000113,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000113,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000113,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000113,
                            "seq": 5,
                            "progress": 4,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000114": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000114,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000114,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000114,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000114,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000114,
                            "seq": 5,
                            "progress": 4,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000115": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000115,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000115,
                            "seq": 2,
                            "progress": 2,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000115,
                            "seq": 3,
                            "progress": 3,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000115,
                            "seq": 4,
                            "progress": 4,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000115,
                            "seq": 5,
                            "progress": 4,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000116": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000116,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000116,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000117": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000117,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000117,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000118": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000118,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000118,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000119": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000119,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000119,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                },
                "310000120": {
                    "entries": [
                        {
                            "userId": userid,
                            "missionId": 310000120,
                            "seq": 1,
                            "progress": 1,
                            "missionProgressType": "complete",
                            "missionGroupId": 310000001
                        },
                        {
                            "userId": userid,
                            "missionId": 310000120,
                            "seq": 2,
                            "progress": 1,
                            "missionProgressType": "in_progress",
                            "missionGroupId": 310000001
                        }
                    ]
                }
            }
        },
        userGenericStoryMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterGenericStoryMap.entries).map(([id, story]: [string, any]) => [
                    id,
                    {
                        userId: userid,
                        genericStoryId: Number(id),
                        status: "already_read"
                    }
                ])
            )
        },
        userLiveBoostRecoveryItemList: undefined,
        userHighScoreMusicRating: undefined,
        userHighScoreMusicRatingMap: undefined,
        userSeason: {
            seasonId: (() => {
                const now = Date.now();
                const entries = Object.values(master.masterSeasonBasicMap.entries) as any[];
                const current = entries.find(s => Number(s.startAt) <= now && now < Number(s.endAt));
                return current?.seasonId;
            })()
        },
        userQualifyTournamentMusicScoreMap: undefined,
        userEventStoryMemorialMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterEventStoryMemorialConfigMap.entries).map(([eventId, config]: [string, any]) => [
                    eventId,
                    {
                        eventId: Number(eventId),
                        userEventStoryList: {
                            entries: Array.from({ length: past.pastEventStoryMap.entries[String(eventId)]?.entries?.length }, (_, i) => ({
                                userId: userid,
                                eventId: Number(eventId),
                                seq: i,
                                status: "already_read"
                            }))
                        },
                        isExistUnReadStory: false,
                        isLocked: false
                    }
                ])
            )
        },
        userReleasedBondsIdList: {
            // @ts-ignore
            entries: Object.keys(master.masterBondsMap?.entries || {}).map(Number)
        },
        userMiracleTicketMap: { entries: [] },
        userMiracleTicketExchangesMap: {
            entries: []
        },
        userMultiDisconnectionBadPenalty: undefined,
        userSpecialLotteryDrawResultMap: undefined,
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
        userMusicAchievementMap: undefined,
        userBirthdayStoryMap: undefined,
        userGenericAnimationMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterGenericAnimationMap.entries).map((genericAnimationId: any) => [
                    Number(genericAnimationId),
                    {
                        userId: userid,
                        genericAnimationId: Number(genericAnimationId),
                        status: "already_read"
                    }
                ])
            )
        },
        userMusicShopMap: {
            entries: {
                "7": {
                    entries: master.masterMusicList.entries.map((song: any, index: any) => ({
                        userId: userid,
                        musicShopId: index + 1,
                        shopId: 7,
                        shopCategory: "common",
                        musicId: song.musicId,
                        status: "sold_out",          // 已購買
                        seq: index + 1,
                        isInitialDistribution: false
                    }))
                }
            }
        },
        userTitleList: undefined,
        userPurchaseVoidBadPenaltyStandard: undefined,
        userSelectNewYearCardMap: undefined,
        userGachaCountCeilingMap: undefined,
        userBackstageTalkSetReadHistoryMap: undefined,
        userNewMusicIntroductionMap: {
            entries: Object.fromEntries(
                // @ts-ignore
                Object.values(master.masterNewMusicIntroductionMap.entries ?? {}).map((item: any) => [
                    String(item.newMusicIntroductionId),
                    {
                        userId: userid,
                        newMusicIntroductionId: item.newMusicIntroductionId,
                        status: "already_read"
                    }
                ])
            )
        },
        userNewSituationIntroductionMap: {
            entries: Object.fromEntries(
                // @ts-ignore
                master.masterNewSituationIntroductionList.entries.map((item: any) => [
                    String(item.newSituationIntroductionId),
                    {
                        userId: Number(userid),
                        newSituationIntroductionId: Number(item.newSituationIntroductionId),
                        status: "already_read"
                    }
                ])
            )
        },
        userFriendRelationDetail: {
            applicationMap: undefined,
            approvalMap: undefined,
            friendMap: undefined,
            friendLimit: 50,
            approvalLimit: 50,
            applicationLimit: 50
        },
        userNotHaveViewExchangesMiracleTicketIdList: {
            entries: []
        },
        userProfileSituation: undefined,
        userProfileDegreeMap: {
            entries: userProfileDegree
        },
        userDecoFrameInventoryMap: {
            entries: Object.fromEntries(
                Object.values(master.masterDecoFrameMap.entries).map(f => [
                    f.decoFrameId,
                    {
                        userId: Number(userid),
                        decoFrameId: f.decoFrameId,
                        level: 5
                    }
                ])
            )
        },
        userDecoPinsInventoryMap: {
            entries: Object.fromEntries(
                Object.values(master.masterDecoPinsMap.entries).map(p => [
                    p.decoPinsId,
                    {
                        userId: Number(userid),
                        decoPinsId: p.decoPinsId,
                        quantity: 5
                    }
                ])
            )
        },
        userDecoEffectInventoryMap: {
            entries: Object.fromEntries(
                master.masterDecoEffectList.entries
                    .filter(e => Number(e.startAt) <= Date.now() && Number(e.endAt) >= Date.now())
                    .map(e => [
                    e.decoEffectId,
                    {
                        userId: Number(userid),
                        decoEffectId: e.decoEffectId
                    }
                ])
            )
        },
        userDecoEquipment: {
            userDecoCharacterSituation: {
                userId: userid,
                situationId: user.decos["situation"]?.situationId ?? 1,
                situationStatus: user.decos["situation"]?.situationStatus ?? "normal"
            },
            userDecoCharacterLive2d: {
                userId: userid,
                characterId: user.decos["live2d"]?.characterId ?? master.masterCharacterSituationMap.entries[mainDeck.leader].characterId,
                costumeId: user.decos["live2d"]?.costumeId ?? user.wearingCostume[master.masterCharacterSituationMap.entries[mainDeck.leader].characterId].costumeId,
                motionId: user.decos["live2d"]?.motionId ?? Object.values(master.masterDecoCharacterLive2dMotionMap.entries)
                    .filter(m => m.characterId === master.masterCharacterSituationMap.entries[mainDeck.leader].characterId)
                    .sort((a, b) => a.seq - b.seq)[0].motionId,
                backgroundId: user.decos["live2d"]?.backgroundId ?? 1
            },
            userDecoCharacter3d: {
                userId: userid,
                characterId: user.decos["3d"]?.characterId ?? master.masterCharacterSituationMap.entries[mainDeck.leader].characterId,
                dressId: user.decos["3d"]?.dressId ?? user.wearingCostume[master.masterCharacterSituationMap.entries[mainDeck.leader].characterId].dressId,
                hairstyleId: user.decos["3d"]?.hairstyleId ?? user.wearingCostume[master.masterCharacterSituationMap.entries[mainDeck.leader].characterId].hairstyleId,
                motionId: user.decos["3d"]?.motionId ?? master.masterEnableCharacter3dMotionTypeMap.entries[master.masterCharacterSituationMap.entries[mainDeck.leader].characterId]
                    ?.entries?.deco?.entries
                    ?.sort((a, b) => a.seq - b.seq)[0].motionId,
                backgroundId: user.decos["3d"]?.backgroundId ?? 11
            },
            userDecoFramePins: {
                userId: userid,
                decoFrameId: user.decos.frameId ?? 1,
                decoPinsId1: user.decos.framepins?.[0],
                decoPinsId2: user.decos.framepins?.[1],
                decoPinsId3: user.decos.framepins?.[2],
                decoPinsId4: user.decos.framepins?.[3],
                decoPinsId5: user.decos.framepins?.[4],
            },
            userDecoDegreeMap: {
                entries: userProfileDegree
            },
            userDecoAppealMap: {},
            userDecoSetting: {
                useProfileSettingDegree: user.useProfileSettingDegree,
                useProfileSettingSituation: user.useProfileSettingSituation,
                selectedCharacterType: user.selectedCharacterType
            },
            userDecoEffect: {
                userId: userid,
                decoEffectId: user.decos.effect ?? 1
            }
        },
        userMusicVideoListMap: {
            userMusicVideoInventoryListMap: {
                entries: Object.fromEntries(
                    Object.entries(master.masterMusicVideoListMap.entries)
                        .map(([musicId, _]: [string, any]) => [
                            musicId,
                            {
                                entries: [{
                                    userId: userid,
                                    musicId: Number(musicId),
                                    seq: 1
                                }]
                            }
                        ])
                )
            }
        },
        userPurchaseMenuLastVisitMap: {
            entries: {}
        },
        userSkinLaneMap: undefined,
        currentUserEventMusicScoresMap: undefined,
        currentUserEventMusicAchievementsMap: undefined,
        currentUserEventBoxGachaMap: undefined,
        userMonthlyPurchaseMap: undefined,
        userSubscriptionList: undefined,
        userCommentBannerList: undefined,
        userEventBoxGachaSpinSettings: undefined,
        userMorfonicaStoryList: storyList(master.masterMorfonicaStoryMap),
        userMatchingBonusList: undefined,
        userRaiseASuilenStoryList: storyList(master.masterRaiseASuilenStoryMap),
        userCollaboOriginalMusicScoreMap: undefined,
        userDailyLive: {
            lastClearedAt: 0,
            liveStartedAt: 0,
            getDailyLiveRewardId: 6
        },
        userDailyLiveTotalRewardHistory: undefined,
        userComebackStatus: undefined,
        userGraphicalInformationList: undefined,
        userMultiLiveCountRewardList: undefined,
        userDigestStoryList: {
            entries: Object.values(master.masterDigestStoryDetailList.entries).map((story: any) => ({
                userId: userid,
                digestStoryId: story.digestStoryId,
                status: "already_read"
            })).filter((v, i, a) => a.findIndex(t => t.digestStoryId === v.digestStoryId) === i)
        },
        userLiveBoostUseBonusLimitList: undefined,
        userReceivablePresentLocationList: undefined,
        userPanelMissionList: undefined,
        userBirthdayIntroductionMap: undefined,
        userFestivalTeamMap: undefined,
        userLimitedItemList: undefined,
        userLimitedExchangesList: {
            entries: []
        },
        userDeckList: {
            entries: userDeckList
        },
        userAddMusicDifficultyIntroductionList: undefined,
        userGalleryList: undefined,
        userBandDeckRatingMap: undefined,
        updatedBandDeckRankList: undefined,
        userStageChallengeStageNoMap: undefined,
        userStageChallengeMap: undefined,
        userStageChallengeScoreMap: undefined,
        userStarSeal: {
            amount: user.seal
        },
        userLiveBoostUseFull: {
            dailyUseFullCount: 99,
            resetTime: 0
        },
        userAutoLive: {
            resetTime: 0
        },
        userMonthlyMission: undefined,
        userMonthlyMissionRewardList: undefined,
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
        },
        userCharacterPotentialLevelMap: {
            entries: (() => {
                const entries: Record<string, any> = {};
                for (let charId = 1; charId <= 40; charId++) {
                    entries[String(charId)] = {
                        performanceLevel: 1,
                        techniqueLevel: 1,
                        visualLevel: 1
                    };
                }
                return entries;
            })()
        },
        userMusicVideo3dListMap: {
            userMusicVideo3dInventoryListMap: {
                entries: Object.fromEntries(
                    Object.entries(master.masterMusicVideo3dMap?.entries ?? {}).map(([_, mv]: [string, any]) => [
                        String(mv.musicId),
                        {
                            entries: [{
                                musicVideo3dId: mv.musicVideo3dId,
                                musicId: mv.musicId,
                                seq: mv.seq
                            }]
                        }
                    ])
                )
            }
        },
        userCostume3dDressInventoryMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterCostume3dDressMap.entries).map(id => [
                    id,
                    {
                        costume3dDressId: Number(id),
                        status: "obtained"
                    }
                ])
            )
        },
        userCostume3dHairstyleInventoryMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterCostume3dHairstyleMap.entries).map(id => [
                    id,
                    {
                        costume3dHairstyleId: Number(id),
                        status: "obtained"
                    }
                ])
            )
        },
        userWearingCostume3dMap: {
            entries: Object.fromEntries(
                Object.entries(user.wearingCostume).map(([charId, costume]: [string, any]) => [
                    String(charId),
                    {
                        characterId: Number(charId),
                        costume3dDressId: costume.dressId,
                        costume3dHairstyleId: costume.hairstyleId
                    }
                ])
            )
        },
        userMusicClearInfoMap: computeMusicClearInfo(user.musicScore),
        userMusicClearCountInfoMap: computeMusicClearCountInfo(user.musicScore),
        userCharacterSituationCountMap: undefined,
        userDecoCharacterBackgroundInventoryMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterDecoCharacterBackgroundMap.entries).map((backgroundId) => [
                    backgroundId,
                    {
                        userId: userid,
                        backgroundId
                    }
                ])
            )
        },
        userDecoCharacter3dMotionInventoryListMap: {
            entries: Object.fromEntries(
                Object.entries(DECO_MOTION_MAP).map(([charId, motionIds]) => [
                    charId,
                    {
                        entries: motionIds.map(motionId => ({
                            userId: userid,
                            motionId
                        }))
                    }
                ])
            )
        },
        userMusicVideo3dCustomDeckMap: undefined,
        userCostume3dMakingItemInventoryMap: undefined,
        userMusicVideo3dOriginalDeckCostumeMap: undefined,
        userLimitBreakItemList: undefined,
        userDecoAppealInventoryMap: undefined,
        userInvitationInfo: undefined,
        userCharacterUseStyleMap: undefined,
        userPurchaseStarList: undefined,
        userInviteMissionListMap: undefined,
        userGachaBonusMap: undefined,
        userStampVoiceMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterStampMap.entries)
                    .filter((stampId) => master.masterStampMap.entries[stampId].withVoice)
                    .map((stampId) => [
                        Number(stampId),
                        // @ts-ignore
                        { userId: userid, stampId: Number(stampId) }
                    ])
            )
        },
        userEventRankedCountAppeal: undefined,
        userEventMusicRankedCountAppeal: undefined,
        userMyGoStoryList: storyList(master.masterMyGoStoryMap),
        userTerms: {
            userId: userid
        },
        userCharacterMissionBonusMap: undefined,
        userPhotoStudioMap: undefined,
        userGachaSelfPickupSituationList: undefined,
        userPhotoBackInventoryMap: undefined,
        userLimitedSkinInventoryMap: undefined,
        userMusicClearCountDetailMap: undefined

    }

    const message = SuiteUserGetResponse.fromJSON(data);
    const buffer = Buffer.from(SuiteUserGetResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.removeHeader('Content-Length');
    res.removeHeader('Transfer-Encoding');
    res.setHeader('content-type', 'application/octet-stream');

    res.writeHead(200);
    res.write(encBuffer);
    res.end();
})

export default router;