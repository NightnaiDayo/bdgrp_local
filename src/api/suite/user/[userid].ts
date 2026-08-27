import { Router } from "express";
import { encrypt } from "@util/encrypt";
import { db, saveDb } from "@db";
import { SuiteUserGetResponse } from "@proto"
import { getMaster } from "@master";
import {
    computeMusicClearInfo,
    computeMusicClearCountInfo,
    buildUserSituations,
    buildUserProfileDegree,
    buildCharacterRankMap
} from "@util/helpers";
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

router.get('/', async (req, res) => {
    // @ts-ignore
    const userid = req.params.userid

    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const master = getMaster();

    if (!user) return res.status(404).send();

    if(process.env.SERVER !== "JP") {
        master.masterMusicList.entries.push(
            {
                "musicId": 84,
                "musicTitle": "深愛",
                "bgmId": "bgm084",
                "bgmFile": "084_shin_ai",
                "lyricist": "水樹奈々",
                "composer": "上松範康（Elements Garden）",
                "tag": "anime",
                "arranger": "都丸椋太（Elements Garden）",
                "ruby": "しんあい",
                "bandId": 5,
                "howToGet": "ＣｉＲＣＬＥの楽曲ショップで交換",
                "achievements": [
                    {
                        "musicId": 84,
                        "achievementType": "combo_easy",
                        "rewardType": "coin",
                        "quantity": 5000
                    },
                    {
                        "musicId": 84,
                        "achievementType": "combo_expert",
                        "rewardType": "coin",
                        "quantity": 20000
                    },
                    {
                        "musicId": 84,
                        "achievementType": "combo_hard",
                        "rewardType": "coin",
                        "quantity": 15000
                    },
                    {
                        "musicId": 84,
                        "achievementType": "combo_normal",
                        "rewardType": "coin",
                        "quantity": 10000
                    },
                    {
                        "musicId": 84,
                        "achievementType": "combo_special",
                        "rewardType": "coin",
                        "quantity": 20000
                    },
                    {
                        "musicId": 84,
                        "achievementType": "full_combo_easy",
                        "rewardType": "coin",
                        "quantity": 10000
                    },
                    {
                        "musicId": 84,
                        "achievementType": "full_combo_expert",
                        "rewardType": "star",
                        "quantity": 50
                    },
                    {
                        "musicId": 84,
                        "achievementType": "full_combo_hard",
                        "rewardType": "star",
                        "quantity": 50
                    },
                    {
                        "musicId": 84,
                        "achievementType": "full_combo_normal",
                        "rewardType": "coin",
                        "quantity": 20000
                    },
                    {
                        "musicId": 84,
                        "achievementType": "full_combo_special",
                        "rewardType": "star",
                        "quantity": 50
                    },
                    {
                        "musicId": 84,
                        "achievementType": "score_rank_a",
                        "rewardType": "practice_ticket",
                        "rewardId": 2,
                        "quantity": 1
                    },
                    {
                        "musicId": 84,
                        "achievementType": "score_rank_b",
                        "rewardType": "practice_ticket",
                        "rewardId": 2,
                        "quantity": 1
                    },
                    {
                        "musicId": 84,
                        "achievementType": "score_rank_c",
                        "rewardType": "practice_ticket",
                        "rewardId": 2,
                        "quantity": 1
                    },
                    {
                        "musicId": 84,
                        "achievementType": "score_rank_s",
                        "rewardType": "star",
                        "quantity": 50
                    },
                    {
                        "musicId": 84,
                        "achievementType": "score_rank_ss",
                        "rewardType": "star",
                        "quantity": 50
                    }
                ],
                "jacketImage": "084_shin_ai",
                "seq": 1407,
                "publishedAt": "1513576800000",
                "closedAt": "4102714800000",
                "transitionMethod": "music_shop",
                "phonetic": "シンアイ",
                "musicDataType": "normal",
                "categorySetId": 32
            },
        )
        master.masterMusicJacketMap.entries["84"] = {
            "entries": [
                {
                    "musicJacketId": 118,
                    "musicId": 84,
                    "seq": 5,
                    "jacketImage": "084_shin_ai",
                    "startAt": "1513576800000"
                }
            ]
        }
    }

    let deckName = "";

    switch(process.env.SERVER) {
        case 'TW':
            deckName = "樂團1"
            break;
        case 'JP':
            deckName = "バンド1"
            break;
        case 'GL':
            deckName = "Band 1"
            break;
        case 'CN':
            deckName = "乐队1"
            break;
    }

    // DB defaults
    if (!user.situationIllust) { user.situationIllust = {}; saveDb(); }
    if (!user.decks) {
        user.decks = [{
            deckId: 1,
            deckName,
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
    if (!user.areaItems) { user.areaItems = {}; saveDb(); }

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

    // userCharacterMap
    const charIds = [...Array.from({ length: 40 }, (_, i) => i + 1), 601];
    const userCharacterMap: Record<string, any> = Object.fromEntries(
        charIds.map(id => [String(id), {
            userId: Number(userid),
            characterId: id,
            costumeId: user.wearingCostume[String(id)].costumeId
        }])
    );

    // userSituations
    const userSituations = buildUserSituations(userid, master, user);

    const userDeckList = user.decks;

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

    const userProfileDegree = buildUserProfileDegree(userid, user);

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

    const validSpawnPoints = new Set(Object.keys(master.masterAreaItemSpawnMap.entries));

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
        userCharacterMap: { entries: userCharacterMap },
        userSituationMap: {
            entries: Object.fromEntries(userSituations.map((sit: any) => [sit.situationId, sit]))
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
            entries: Array.from({ length: 9 }, (_, i) => ({
                userId: userid, bondsId: i + 1, level: 1, bonds: 5 * (i + 2)
            }))
        },
        userBandRankMap: {
            entries: Object.fromEntries(
                [1, 2, 3, 4, 5, 18, 21, 45].map(bandId => [
                    String(bandId),
                    { userId: userid, bandId, bandRank: 50, exp: 0, totalExp: 0, nextExp: 0 }
                ])
            )
        },
        userPoppinPartyStoryList: storyList(master.masterPoppinPartyStoryMap),
        userAfterglowStoryList: storyList(master.masterAfterglowStoryMap),
        userPastelPalettesStoryList: storyList(master.masterPastelPalettesStoryMap),
        userHelloHappyWorldStoryList: storyList(master.masterHelloHappyWorldStoryMap),
        userRoseliaStoryList: storyList(master.masterRoseliaStoryMap),
        userItemList: {
            entries: Object.values(master.masterItemMap.entries).map((item: any) => ({
                userId: userid, itemId: item.itemId, quantity: 6767
            }))
        },
        userCommonsLive2dMap: {
            entries: Object.fromEntries(
                Object.entries(aggregated).map(([cat, idArray]) => [
                    cat,
                    { entries: idArray.map(live2dId => ({ live2dId, live2dCategory: cat })) }
                ])
            )
        },
        userEpisodeMap: { entries: userEpisodeMap },
        userAppendParameterMap: undefined,
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
                    { userId: userid, costumeId: costume.costumeId, characterId: costume.characterId }
                ])
            )
        },
        userAfterLiveTalkListMap: undefined,
        userAreaItemMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterAreaItemMap.entries)
                    .filter(([_, areaItem]: any) => validSpawnPoints.has(areaItem.spawnPoint))
                    .map(([id, areaItem]: any) => [
                        id,
                        { userId: userid, areaItemId: areaItem.areaItemId, areaItemCategory: areaItem.categoryId, level: 8 }
                    ])
            ),
            newlyOpenedContents: { entries: [] }
        },
        userResourceCount: undefined,
        userLiveBoost: {
            userId: userid,
            liveBoost: 67,
            serverDate: Date.now().toString(),
            liveBoostBonusType: "default"
        },
        userExchangesList: {
            entries: [{ userId: userid, exchangesId: 1563, resetAt: "1779155725000" }]
        },
        userGachaTicketList: undefined,
        userGachaStatusMap: undefined,
        userAreaStatusMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterAreaMap.entries)
                    .filter(([_, area]) => area.areaType === "common")
                    .map(([areaId]) => [Number(areaId), { userId: userid, areaId: Number(areaId) }])
            )
        },
        userLoginBonusMap: { entries: {} },
        userHomeBannerList: undefined,
        userStampMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterStampMap.entries).map(([stampId, stamp]) => [
                    Number(stampId),
                    { userId: userid, stampId: Number(stampId), seq: 1, isUnlockVoice: !!stamp.withVoice }
                ])
            )
        },
        userDegreeMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterDegreeMap.entries).map(degreeId => [
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
                    { entries: ids.map(id => ({ characterId: Number(charId), live2dId: id })) }
                ])
            )
        },
        userEventExchangesList: { entries: [] },
        userEventItemList: {
            entries: Object.values(master.masterEventItemMap.entries).map((item: any) => ({
                userId: userid,
                eventItemId: item.eventItemId,
                quantity: 1
            }))
        },
        userPurchaseMap: {
            entries: Object.fromEntries(
                purchaseIds.map(id => [Number(id), { userId: userid, purchaseId: Number(id), count: 0 }])
            )
        },
        userMissionMap: { entries: missions },
        userGenericStoryMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterGenericStoryMap.entries).map(([id, story]: [string, any]) => [
                    id,
                    { userId: userid, genericStoryId: Number(id), status: "already_read" }
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
                            entries: Array.from(
                                { length: past.pastEventStoryMap.entries[String(eventId)]?.entries?.length ?? 0 },
                                (_, i) => ({ userId: userid, eventId: Number(eventId), seq: i, status: "already_read" })
                            )
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
        userMiracleTicketExchangesMap: { entries: [] },
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
                        { userId: Number(userid), birthdayStoryId: Number(item.birthdayStoryId), status: "already_read" }
                    ])
            )
        },
        userGenericAnimationMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterGenericAnimationMap.entries).map((id: any) => [
                    Number(id),
                    { userId: userid, genericAnimationId: Number(id), status: "already_read" }
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
                        status: "sold_out",
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
                    { userId: userid, newMusicIntroductionId: item.newMusicIntroductionId, status: "already_read" }
                ])
            )
        },
        userNewSituationIntroductionMap: {
            entries: Object.fromEntries(
                // @ts-ignore
                master.masterNewSituationIntroductionList.entries.map((item: any) => [
                    String(item.newSituationIntroductionId),
                    { userId: userid, newSituationIntroductionId: item.newSituationIntroductionId, status: "already_read" }
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
        userNotHaveViewExchangesMiracleTicketIdList: { entries: [] },
        userProfileSituation: undefined,
        userProfileDegreeMap: { entries: userProfileDegree },
        userDecoFrameInventoryMap: {
            entries: Object.fromEntries(
                Object.values(master.masterDecoFrameMap.entries).map(f => [
                    f.decoFrameId,
                    { userId: Number(userid), decoFrameId: f.decoFrameId, level: 5 }
                ])
            )
        },
        userDecoPinsInventoryMap: {
            entries: Object.fromEntries(
                Object.values(master.masterDecoPinsMap.entries).map(p => [
                    p.decoPinsId,
                    { userId: Number(userid), decoPinsId: p.decoPinsId, quantity: 5 }
                ])
            )
        },
        userDecoEffectInventoryMap: {
            entries: Object.fromEntries(
                master.masterDecoEffectList.entries
                    .filter(e => Number(e.startAt) <= Date.now() && Number(e.endAt) >= Date.now())
                    .map(e => [e.decoEffectId, { userId: Number(userid), decoEffectId: e.decoEffectId }])
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
            userDecoDegreeMap: { entries: userProfileDegree },
            userDecoAppealMap: {},
            userDecoSetting: {
                useProfileSettingDegree: user.useProfileSettingDegree,
                useProfileSettingSituation: user.useProfileSettingSituation,
                selectedCharacterType: user.selectedCharacterType
            },
            userDecoEffect: { userId: userid, decoEffectId: user.decos.effect ?? 1 }
        },
        userMusicVideoListMap: {
            userMusicVideoInventoryListMap: {
                entries: Object.fromEntries(
                    Object.entries(master.masterMusicVideoListMap.entries).map(([musicId, _]: [string, any]) => [
                        musicId,
                        { entries: [{ userId: userid, musicId: Number(musicId), seq: 1 }] }
                    ])
                )
            }
        },
        userPurchaseMenuLastVisitMap: { entries: {} },
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
        userDailyLive: { lastClearedAt: 0, liveStartedAt: 0, getDailyLiveRewardId: 6 },
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
        userLimitedExchangesList: { entries: [] },
        userDeckList: { entries: userDeckList },
        userAddMusicDifficultyIntroductionList: undefined,
        userGalleryList: undefined,
        userBandDeckRatingMap: undefined,
        updatedBandDeckRankList: undefined,
        userStageChallengeStageNoMap: undefined,
        userStageChallengeMap: undefined,
        userStageChallengeScoreMap: undefined,
        userStarSeal: { amount: user.seal },
        userLiveBoostUseFull: { dailyUseFullCount: 67, resetTime: 0 },
        userAutoLive: { resetTime: 0 },
        userMonthlyMission: undefined,
        userMonthlyMissionRewardList: undefined,
        userCharacterRankMap: buildCharacterRankMap(),
        userCharacterPotentialLevelMap: {
            entries: Object.fromEntries(
                Array.from({ length: 40 }, (_, i) => [String(i + 1), {
                    performanceLevel: 1, techniqueLevel: 1, visualLevel: 1
                }])
            )
        },
        userMusicVideo3dListMap: {
            userMusicVideo3dInventoryListMap: {
                entries: Object.fromEntries(
                    Object.entries(master.masterMusicVideo3dMap?.entries ?? {}).map(([_, mv]: [string, any]) => [
                        String(mv.musicId),
                        { entries: [{ musicVideo3dId: mv.musicVideo3dId, musicId: mv.musicId, seq: mv.seq }] }
                    ])
                )
            }
        },
        userCostume3dDressInventoryMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterCostume3dDressMap.entries).map(id => [
                    id, { costume3dDressId: Number(id), status: "obtained" }
                ])
            )
        },
        userCostume3dHairstyleInventoryMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterCostume3dHairstyleMap.entries).map(id => [
                    id, { costume3dHairstyleId: Number(id), status: "obtained" }
                ])
            )
        },
        userWearingCostume3dMap: {
            entries: Object.fromEntries(
                Object.entries(user.wearingCostume).map(([charId, costume]: [string, any]) => [
                    String(charId),
                    { characterId: Number(charId), costume3dDressId: costume.dressId, costume3dHairstyleId: costume.hairstyleId }
                ])
            )
        },
        userMusicClearInfoMap: computeMusicClearInfo(user.musicScore),
        userMusicClearCountInfoMap: computeMusicClearCountInfo(user.musicScore),
        userCharacterSituationCountMap: undefined,
        userDecoCharacterBackgroundInventoryMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterDecoCharacterBackgroundMap.entries).map(backgroundId => [
                    backgroundId, { userId: userid, backgroundId }
                ])
            )
        },
        userDecoCharacter3dMotionInventoryListMap: {
            entries: Object.fromEntries(
                Object.entries(DECO_MOTION_MAP).map(([charId, motionIds]) => [
                    charId,
                    { entries: motionIds.map(motionId => ({ userId: userid, motionId })) }
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
                    .filter(stampId => master.masterStampMap.entries[stampId].withVoice)
                    .map(stampId => [Number(stampId), { userId: userid, stampId: Number(stampId) }])
            )
        },
        userEventRankedCountAppeal: undefined,
        userEventMusicRankedCountAppeal: undefined,
        userMyGoStoryList: storyList(master.masterMyGoStoryMap),
        userTerms: { userId: userid },
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

    console.log(data.userMusicInventoryList.entries.find((e: any) => e.musicId === 84));

    res.removeHeader('Content-Length');
    res.removeHeader('Transfer-Encoding');
    res.setHeader('content-type', 'application/octet-stream');
    res.writeHead(200);
    res.write(encBuffer);
    res.end();
})

export default router;