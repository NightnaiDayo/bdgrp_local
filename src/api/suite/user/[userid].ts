import { Router } from "express";
import { encrypt } from "@util/encrypt";
import { db, saveDb } from "@db";
import { SuiteUserGetResponse } from "@proto"
import cards from "@gamedata/cards.json";
import songs from "@gamedata/songs.json"
import costumes from "@gamedata/costumes.json"
import degrees from "@gamedata/degrees.json"
import stamps from "@gamedata/stamps.json"
import costumes3d from "@gamedata/costume3dDress.json"
import costumes3dHairstyle from "@gamedata/costume3dHairstyle.json"
import * as stories from "@gamedata/stories"

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    //@ts-ignore
    const userid = req.params.userid

    const user = db.Users.find((u: any) => u.userId == userid);

    if (!user) return res.status(404).send();

    const userCharacterMap: Record<string, any> = {};
    let userSituations;
    
    for(let i = 1; i <=40; i++) {
        userCharacterMap[String(i)] = {
            userId: userid,
            characterId: i,
            costumeId: i >= 36 ? (1786 + (i - 36)) : (1607 + i)
        }
    }
    userCharacterMap["601"] = {
        userId: userid,
        characterId: 601,
        costumeId: 1643
    }
    if(!user.situations) {
        userSituations = cards.situations.map(card => ({
                userId: userid,
                situationId: Number(card.situationId),
                level: (card.rarity >= 3 ? card.levelLimit + 10 : card.levelLimit),
                exp: 0,
                createdAt: String(Date.now()),
                addExp: 0,
                trainingStatus: (card.rarity >= 3 ? "done" : "not_doing"),
                duplicateCount: 0,
                illust: (card.rarity >= 3 ? "after_training" : "normal"),
                skillExp: 0,
                skillLevel: 5,
                limitBreakRank: 0
        }))

        user.situations = userSituations

        saveDb();

    } else {
        userSituations = user.situations
    }

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
                tutorialEndedAt: String(user.tutorialEndedAt)
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
                degree: user.degree,
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
            entries: Object.values(stories.main).map((story: any) => ({
                userId: userid,
                storyId: story.mainStoryId,
                status: "already_read"
            }))
        },
        userPracticeTicketList: undefined,
        userBondsList: undefined,
        userBandRankMap: {

        },
        userPoppinPartyStoryList: {
            entries: Object.values(stories.ppp).map((story: any) => ({
                userId: userid,
                bandStoryId: story.bandStoryId,
                bandId: story.bandId,
                status: "already_read",
                seq: story.seq
            }))
        },
        userAfterglowStoryList: {
            entries: Object.values(stories.afterglow).map((story: any) => ({
                userId: userid,
                bandStoryId: story.bandStoryId,
                bandId: story.bandId,
                status: "already_read",
                seq: story.seq
            }))
        },
        userPastelPalettesStoryList: {
            entries: Object.values(stories.paspal).map((story: any) => ({
                userId: userid,
                bandStoryId: story.bandStoryId,
                bandId: story.bandId,
                status: "already_read",
                seq: story.seq
            }))
        },
        userHelloHappyWorldStoryList: {
            entries: Object.values(stories.hhw).map((story: any) => ({
                userId: userid,
                bandStoryId: story.bandStoryId,
                bandId: story.bandId,
                status: "already_read",
                seq: story.seq
            }))
        },
        userRoseliaStoryList: {
            entries: Object.values(stories.roselia).map((story: any) => ({
                userId: userid,
                bandStoryId: story.bandStoryId,
                bandId: story.bandId,
                status: "already_read",
                seq: story.seq
            }))
        },
        userItemList: undefined,
        userCommonsLive2dMap: {

        },
        userEpisodeMap: undefined,
        userMusicInventoryList: {
            entries: songs.songs.map(song => ({
                userId: userid,
                musicId: song.musicId,
                seq: 1,
                hasMv: Array.isArray(song.musicVideos) && song.musicVideos.length > 0,
                createdAt: String(Date.now())
            }))
        },
        userCostumeMap: {
            entries: Object.fromEntries(
                costumes.costumes.map((costumeId: number) => [
                    String(costumeId),
                    {
                        userId: userid,
                        costumeId
                    }
                ])
            )
        },
        userAfterLiveTalkListMap: {

        },
        userAreaItemMap: {

        },
        userResourceCount: {

        },
        userLiveBoost: {

        },
        userExchangesList: {

        },
        userGachaTicketList: undefined,
        userGachaStatusMap: undefined,
        userAreaStatusMap: {

        },
        userLoginBonusMap: undefined,
        userHomeBannerList: {

        },
        userStampMap: {
            entries: Object.fromEntries(
                stamps.stamps.map((stampId: number) => [
                    String(stampId),
                    { userId: userid, stampId, seq: 1, isUnlockVoice: false }
                ])
            )
        },
        userDegreeMap: {
            entries: Object.fromEntries(
                degrees.degrees.map((degreeId: number) => [
                    String(degreeId),
                    { userId: userid, degreeId }
                ])
            )
        },
        userBadPenalty: undefined,
        userCharacterProfileLive2dMap: {

        },
        userEventExchangesList: {

        },
        userEventItemList: undefined,
        userPurchaseMap: undefined,
        userMissionMap: undefined,
        userGenericStoryMap: {
            entries: Object.fromEntries(
                Object.values(stories.generic).map((story: any) => [
                    String(story.genericStoryId),
                    {
                        userId: userid,
                        genericStoryId: story.genericStoryId,
                        status: "already_read"
                    }
                ])
            )
        },
        userLiveBoostRecoveryItemList: undefined,
        userHighScoreMusicRatingMap: {

        },
        userSeason: {
            seasonId: 37
        },
        userQualifyTournamentMusicScoreMap: undefined,
        userEventStoryMemorialMap: undefined,
        userReleasedBondsIdList: {

        },
        userMiracleTicketMap: undefined,
        userMiracleTicketExchangesMap: undefined,
        userMultiDisconnectionBadPenalty: undefined,
        userSpecialLotteryDrawResultMap: undefined,
        userMusicScoreMap: {

        },
        userMusicAchievementMap: undefined,
        userBirthdayStoryMap: undefined,
        userGenericAnimationMap: {

        },
        userMusicShopMap: {
            entries: Object.fromEntries(
                songs.songs.map((song: any, i: number) => [
                    String(i + 1),
                    {
                        userId: userid,
                        musicShopId: i + 1,
                        shopId: 7,
                        shopCategory: "common",
                        musicId: Number(song.musicId),
                        status: "purchase",
                        seq: i + 1,
                        isInitialDistribution: false
                    }
                ])
            )
        },
        userTitleList: undefined,
        userPurchaseVoidBadPenaltyStandard: undefined,
        userSelectNewYearCardMap: undefined,
        userGachaCountCeilingMap: undefined,
        userBackstageTalkSetReadHistoryMap: undefined,
        userNewMusicIntroductionMap: undefined,
        userNewSituationIntroductionMap: undefined,
        userFriendRelationDetail: {
            applicationMap: undefined,
            approvalMap: undefined,
            friendMap: undefined,
            friendLimit: 50,
            approvalLimit: 50,
            applicationLimit: 50
        },
        userNotHaveViewExchangesMiracleTicketIdList: undefined,
        userProfileSituation: undefined,
        userProfileDegreeMap: undefined,
        userDecoFrameInventoryMap: undefined,
        userDecoPinsInventoryMap: undefined,
        userDecoEffectInventoryMap: undefined,
        userDecoEquipment: undefined/*{
            userDecoCharacterSituation: {

            },
            userDecoCharacterLive2d: {

            },
            userDecoCharacter3d: {

            },
            userDecoFramePins: {

            },
            userDecoDegreeMap: {

            },
            userDecoAppealMap: {

            },
            userDecoSetting: {

            },
            userDecoEffect: {

            }
        }*/,
        userMusicVideoListMap: {
            userMusicVideoInventoryListMap: {
                entries: Object.fromEntries(
                    songs.songs
                        .filter((song: any) => Array.isArray(song.musicVideos) && song.musicVideos.length > 0)
                        .map((song: any, i: number) => [
                            String(song.musicId),
                            {
                                entries: [{
                                    userId: userid,
                                    musicId: Number(song.musicId),
                                    seq: 1
                                }]
                            }
                        ])
                )
            }
        },
        userPurchaseMenuLastVisitMap: undefined,
        userSkinLaneMap: undefined,
        currentUserEventMusicScoresMap: undefined,
        currentUserEventMusicAchievementsMap: undefined,
        currentUserEventBoxGachaMap: undefined,
        userMonthlyPurchaseMap: undefined,
        userSubscriptionList: undefined,
        userCommentBannerList: undefined,
        userEventBoxGachaSpinSettings: undefined,
        userMorfonicaStoryList: {
            entries: Object.values(stories.morfonica).map((story: any) => ({
                userId: userid,
                bandStoryId: story.bandStoryId,
                bandId: story.bandId,
                status: "already_read",
                seq: story.seq
            }))
        },
        userMatchingBonusList: undefined,
        userRaiseASuilenStoryList: {
            entries: Object.values(stories.ras).map((story: any) => ({
                userId: userid,
                bandStoryId: story.bandStoryId,
                bandId: story.bandId,
                status: "already_read",
                seq: story.seq
            }))
        },
        userCollaboOriginalMusicScoreMap: undefined,
        userDailyLive: {
            lastClearedAt: undefined,
            liveStartedAt: undefined,
            getDailyLiveRewardId: 6
        },
        userDailyLiveTotalRewardHistory: undefined,
        userComebackStatus: undefined,
        userGraphicalInformationList: undefined,
        userMultiLiveCountRewardList: undefined,
        userDigestStoryList: {
            entries: Object.values(stories.digest).map((story: any) => ({
                userId: userid,
                digestStoryId: story.digestStoryId,
                status: "already_read",
            }))
        },
        userLiveBoostUseBonusLimitList: undefined,
        userReceivablePresentLocationList: undefined,
        userPanelMissionList: undefined,
        userBirthdayIntroductionMap: undefined,
        userFestivalTeamMap: undefined,
        userLimitedItemList: undefined,
        userDeckList: {
            entries: [
                {
                    deckId: 1,
                    deckName: "樂團1",
                    leader: 947,
                    member1: 1765,
                    member2: 1730,
                    member3: 2193,
                    member4: 2018,
                    deckType: "normal"
                }
            ]
        },
        userAddMusicDifficultyIntroductionList: undefined,
        userGalleryList: undefined,
        userBandDeckRatingMap: undefined,
        updatedBandDeckRankList: undefined,
        userStageChallengeStageNoMap: undefined,
        userStageChallengeMap: undefined,
        userStageChallengeScoreMap: undefined,
        userStarSeal: {

        },
        userLiveBoostUseFull: {
            dailyUseFullCount: 114,
            resetTime: 0
        },
        userAutoLive: {
            resetTime: 0
        },
        userMonthlyMission: undefined,
        userMonthlyMissionRewardList: undefined,
        userCharacterRankMap: {

        },
        userCharacterPotentialLevelMap: {

        },
        userMusicVideo3dListMap: {

        },
        userCostume3dDressInventoryMap: {
            entries: Object.fromEntries(
                costumes3d.costume3dDress.map((costumeId: number) => [
                    String(costumeId),
                    {
                        costume3dDressId: costumeId,
                        status: "obtained"
                    }
                ])
            )
        },
        userCostume3dHairstyleInventoryMap: {
            entries: Object.fromEntries(
                costumes3dHairstyle.costume3dHairstyle.map((costumeId: number) => [
                    String(costumeId),
                    {
                        costume3dHairstyleId: costumeId,
                        status: "obtained"
                    }
                ])
            )
        },
        userWearingCostume3dMap: undefined,
        userMusicClearInfoMap: {

        },
        userMusicClearCountInfoMap: {

        },
        userCharacterSituationCountMap: {

        },
        userDecoCharacterBackgroundInventoryMap: undefined,
        userDecoCharacter3dMotionInventoryListMap: undefined,
        userMusicVideo3dCustomDeckMap: {

        },
        userCostume3dMakingItemInventoryMap: {

        },
        userMusicVideo3dOriginalDeckCostumeMap: {

        },
        userLimitBreakItemList: {

        },
        userDecoAppealInventoryMap: {

        },
        userInvitationInfo: {

        },
        userCharacterUseStyleMap: {

        },
        userPurchaseStarList: undefined,
        userInviteMissionListMap: {

        },
        userGachaBonusMap: {

        },
        userStampVoiceMap: undefined,
        userEventRankedCountAppeal: undefined,
        userEventMusicRankedCountAppeal: undefined,
        userMyGoStoryList: {
            entries: Object.values(stories.mygo).map((story: any) => ({
                userId: userid,
                bandStoryId: story.bandStoryId,
                bandId: story.bandId,
                status: "already_read",
                seq: story.seq
            }))
        },
        userTerms: {
            userId: userid
        },
        userCharacterMissionBonusMap: undefined,
        userPhotoStudioMap: undefined,
        userGachaSelfPickupSituationList: undefined,
        userPhotoBackInventoryMap: {

        },
        userLimitedSkinInventoryMap: undefined,
        userMusicClearCountDetailMap: {

        }

    }

    const message = SuiteUserGetResponse.fromJSON(data);
    const buffer = Buffer.from(SuiteUserGetResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.send(encBuffer);
})

export default router;