import { Router } from "express";
import { encrypt } from "@util/encrypt";
import { db, saveDb } from "@db";
import { SuiteUserGetResponse, SuiteMasterGetResponse } from "@proto"
import { getMaster } from "@master";
import fs from "fs";
import path from "path";

const router = Router({ mergeParams: true })

const past = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pastEvents", `${process.env.SERVER}.json`), 'utf-8'));
const missionsBase = JSON.parse(fs.readFileSync(path.join(process.cwd(), "mission.json"), 'utf-8'));

const DECO_MOTION_MAP: Record<number, number[]> = (() => {
    const map: Record<number, number[]> = {};
    for (let i = 1; i <= 35; i++) {
        const base = 217 + (i - 1) * 5;
        map[i] = [base, base + 1, base + 2];
    }
    map[601] = [392, 393, 394];
    for (let i = 36; i <= 40; i++) {
        const base = 462 + (i - 36) * 5;
        map[i] = [base, base + 1, base + 2];
    }
    return map;
})();

function computeMusicClearInfo(userMusicScore: any): Record<string, any> {
    const difficulties = ["easy", "normal", "hard", "expert", "special"];
    const stats: Record<string, { cleared: number; fullCombo: number; allPerfect: number }> =
        Object.fromEntries(difficulties.map(d => [d, { cleared: 0, fullCombo: 0, allPerfect: 0 }]));

    for (const { entries } of Object.values(userMusicScore) as any[]) {
        if (!entries) continue;
        for (const { musicDifficulty: diff, clearStatus } of entries) {
            if (!stats[diff]) continue;
            stats[diff].cleared++;
            if (clearStatus === "full_combo") stats[diff].fullCombo++;
            if (clearStatus === "all_perfect") stats[diff].allPerfect++;
        }
    }

    return {
        entries: Object.fromEntries(
            difficulties.map(d => [d, {
                clearedMusicCount: stats[d].cleared,
                fullComboMusicCount: stats[d].fullCombo,
                allPerfectMusicCount: stats[d].allPerfect
            }])
        )
    };
}

function computeMusicClearCountInfo(userMusicScore: any): Record<string, any> {
    return {
        entries: Object.fromEntries(
            Object.entries(userMusicScore)
                .map(([id, data]: [string, any]) => [id, data?.entries?.length ?? 0])
                .filter(([, count]) => count > 0)
        )
    };
}

router.get('/', async (req, res) => {
    // @ts-ignore
    const userid = req.params.userid

    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const master = getMaster();

    if (!user) return res.status(404).send();

    // DB defaults
    if (!user.situationIllust) { user.situationIllust = {}; saveDb(); }
    if (!user.decks) {
        user.decks = [{
            deckId: 1,
            deckName: process.env.SERVER === "TW" ? "樂團1" : "バンド1",
            leader: 947, member1: 1765, member2: 1730, member3: 2193, member4: 2018,
            deckType: "normal"
        }];
        saveDb();
    }
    if (!user.musicScore) { user.musicScore = {}; saveDb(); }
    if (!user.wearingCostume) {
        const costumeDefaults: Record<number, any> = {
            36: { dressId: 12854, hairstyleId: 502, costumeId: 1786 },
            37: { dressId: 12855, hairstyleId: 503, costumeId: 1787 },
            38: { dressId: 12856, hairstyleId: 504, costumeId: 1788 },
            39: { dressId: 12857, hairstyleId: 505, costumeId: 1789 },
            40: { dressId: 12858, hairstyleId: 506, costumeId: 1790 },
            601: { dressId: 36, hairstyleId: 36, costumeId: 1643 },
        };
        user.wearingCostume = Object.fromEntries(
            [...Array.from({ length: 40 }, (_, i) => i + 1), 601].map(charId => [
                String(charId),
                costumeDefaults[charId] ?? { dressId: charId, hairstyleId: charId, costumeId: 1332 + charId }
            ])
        );
        saveDb();
    }
    if (!user.decos) { user.decos = {}; saveDb(); }

    const missions = structuredClone(missionsBase);
    Object.values(missions).forEach((group: any) =>
        group.entries.forEach((entry: any) => { entry.userId = userid; })
    );

    const storyList = (storyMap: any) => ({
        entries: Object.values(storyMap.entries).map((story: any) => ({
            userId: userid,
            bandStoryId: story.bandStoryId,
            bandId: story.bandId,
            status: "already_read",
            seq: story.seq
        }))
    });

    const charIds = [...Array.from({ length: 40 }, (_, i) => i + 1), 601];
    const userCharacterMap: Record<string, any> = Object.fromEntries(
        charIds.map(id => [String(id), {
            userId: Number(userid),
            characterId: id,
            costumeId: user.wearingCostume[String(id)].costumeId
        }])
    );

    const userSituations = Object.values(master.masterCharacterSituationMap.entries)
        .filter((card: any) => card.releasedAt !== "4128645600000" && card.releasedAt !== "4131237600000")
        .map((card: any) => {
            const maxLevel = Math.max(...Object.keys(card.parameterMap || {}).map(Number));
            const hasTraining = card.rarity >= 3;
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

    const userDeckList = user.decks;

    if (!user.musicScore) {
        user.musicScore = {}
        saveDb();
    }

    const mainDeck = user.decks[user.mainDeck - 1];
    const situationIds = [mainDeck.leader, mainDeck.member1, mainDeck.member2, mainDeck.member3, mainDeck.member4].filter(Boolean);
    const deckMembers = [...new Set(
        // @ts-ignore
        situationIds.map(sid => master.masterCharacterSituationMap.entries[String(sid)]?.characterId).filter(Boolean)
    )];

    const commonsLive2d: Record<string, Record<number, number[]>> = {};
    for (const entry of Object.values(master.masterCommonsLive2dMap.entries) as any[]) {
        const { live2dCategory: cat, characterId: cid, live2dId: lid } = entry;
        if (!commonsLive2d[cat]) commonsLive2d[cat] = {};
        if (!commonsLive2d[cat][cid]) commonsLive2d[cat][cid] = [];
        commonsLive2d[cat][cid].push(lid);
    }

    const aggregated: Record<string, number[]> = {};
    for (const [cat, charMap] of Object.entries(commonsLive2d)) {
        for (const [charId, ids] of Object.entries(charMap)) {
            if (deckMembers.includes(Number(charId))) {
                if (!aggregated[cat]) aggregated[cat] = [];
                aggregated[cat].push(...ids);
            }
        }
    }

    const userProfileDegree: Record<string, any> = {
        first: { userId: Number(userid), profileDegreeType: "first", degreeId: user.degree[0] }
    };
    if (user.degree[1]) userProfileDegree.second = {
        userId: Number(userid), profileDegreeType: "second", degreeId: user.degree[1]
    };

    const characterProfileL2d: Record<number, number[]> = {};
    for (const entry of Object.values(master.masterCharacterProfileLive2dMap.entries) as any[]) {
        if (!characterProfileL2d[entry.characterId]) characterProfileL2d[entry.characterId] = [];
        characterProfileL2d[entry.characterId].push(entry.characterProfileLive2dId);
    }

    const masterPurchaseMap = master.masterPurchaseMap?.entries || {};
    const purchaseIds = Object.keys(masterPurchaseMap);

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
            entries: missions
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
        userBirthdayStoryMap: {
            entries: Object.fromEntries(
                Object.values(master.masterBirthdayPageMap.entries)
                    .filter((item: any) => item?.birthdayStoryId != null)
                    .map((item: any) => [
                        Number(item.birthdayStoryId),
                        {
                            userId: Number(userid),
                            birthdayStoryId: Number(item.birthdayStoryId),
                            status: "already_read"
                        }
                    ])
            )
        },
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