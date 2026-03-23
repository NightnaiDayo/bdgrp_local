import { Router } from "express";
import { decrypt } from "../../../../util/decrypt";
import { encrypt } from "../../../../util/encrypt";
import { SuiteUserGetResponse } from "../../../../proto/generated/allmsgs"
import { UserRegistrationModel } from "../../../../model/userRegistration";
import { UserGamedataModel } from "../../../../model/userGamedata";
import cards from "../../../../cards.json";
import songs from "../../../../songs.json";
import { UserSituationModel } from "../../../../model/userSituation";
import { UserMusicInventoryModel } from "../../../../model/userMusicInventory"

const router = Router({ mergeParams: true })

const cardFun = {
    level(rarity: number) {
        switch (rarity) {
            case 1:
                return 20;
            case 2:
                return 30;
            case 3:
                return 50;
            case 4:
            case 5:
                return 60;

        }
    },
    trainingStatus(rarity: number) {
        switch (rarity) {
            case 1:
            case 2:
                return "not_doing";
            case 3:
            case 4:
            case 5:
                return "done";

        }
    },
    illust(rarity: number) {
        switch (rarity) {
            case 1:
            case 2:
                return "normal";
            case 3:
            case 4:
            case 5:
                return "after_training";

        }
    }
}

router.get('/', async(req, res) => {
    //@ts-ignore
    const userid = req.params.userid
    let param = { userId: BigInt(userid) }

    const [userRegistration, userGamedata, userSituation, userMusicInventory] = await Promise.all([
        UserRegistrationModel.findOne(param),
        UserGamedataModel.findOne(param),
        UserSituationModel.findOne(param),
        UserMusicInventoryModel.findOne(param)
    ]);
    if (!userRegistration) return res.status(404).send();

    const userCharacterMap: Record<string, any> = {};
    let userSituations = [];
    const userBandRankMap: Record<number, any> = {};
    let userMusicInventoryList = [];
    
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
    if(!userSituation) {
        userSituations = cards.situations.map(card => {
            const situationId = Number(card.situationId)
            return {
                userId: userid,
                situationId,
                level: cardFun.level(card.rarity),
                exp: 0,
                createdAt: BigInt(Date.now()),
                addExp: 0,
                trainingStatus: cardFun.trainingStatus(card.rarity),
                duplicateCount: 0,
                illust: cardFun.illust(card.rarity),
                skillExp: 0,
                skillLevel: 5,
                limitBreakRank: 0
            }
        })

        await new UserSituationModel({
            userId: userid,
            situations: userSituations
        }).save();

    } else {
        userSituations = userSituation.situations
    }

    if (!userMusicInventory) {
        userMusicInventoryList = songs.songs.map(song => ({
            userId: userid,
            musicId: song.musicId,
            seq: 1,
            hasMv: Array.isArray(song.musicVideos) && song.musicVideos.length > 0,
            createdAt: BigInt(Date.now())
        }))

        await new UserMusicInventoryModel({
            userId: userid,
            musics: userMusicInventoryList
        }).save();

    } else {
        userMusicInventoryList = userMusicInventory.musics
    }



    const data = {
        user: {
            userRegistration: userRegistration.toObject(),
            userGamedata: userGamedata.toObject()
        },
        userCharacterMap: {
            entries: userCharacterMap
        },
        userSituationMap: {
            entries: Object.fromEntries(
                userSituations.map(sit => [sit.situationId, sit])
            )
        },
        userMainStoryList: {

        },
        userPracticeTicketList: {

        },
        userBondsList: {

        },
        userBandRankMap: {

        },
        userPoppinPartyStoryList: {

        },
        userAfterglowStoryList: {

        },
        userPastelPalettesStoryList: {

        },
        userHelloHappyWorldStoryList: {

        },
        userRoseliaStoryList: {

        },
        userItemList: {

        },
        userCommonsLive2dMap: {

        },
        userEpisodeMap: {

        },
        userMusicInventoryList: {
            entries: userMusicInventoryList
        },
        userCostumeMap: {

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
        userGachaTicketList: {

        },
        userGachaStatusMap: {

        },
        userAreaStatusMap: {

        },
        userLoginBonusMap: {

        },
        userHomeBannerList: {

        },
        userStampMap: {

        },
        userDegreeMap: {

        },
        userBadPenalty: undefined,
        userCharacterProfileLive2dMap: {

        },
        userEventExchangesList: {

        },
        userEventItemList: {

        },
        userPurchaseMap: {

        },
        userMissionMap: {

        },
        userGenericStoryMap: {

        },
        userLiveBoostRecoveryItemList: {

        },
        userHighScoreMusicRatingMap: {

        },
        userSeason: {

        },
        userQualifyTournamentMusicScoreMap: {

        },
        userEventStoryMemorialMap: {

        },
        userReleasedBondsIdList: {

        },
        userMiracleTicketMap: {

        },
        userMiracleTicketExchangesMap: {

        },
        userMultiDisconnectionBadPenalty: undefined,
        userSpecialLotteryDrawResultMap: {

        },
        userMusicScoreMap: {

        },
        userMusicAchievementMap: {

        },
        userBirthdayStoryMap: {

        },
        userGenericAnimationMap: {

        },
        userMusicShopMap: {

        },
        userTitleList: {

        },
        userPurchaseVoidBadPenaltyStandard: undefined,
        userSelectNewYearCardMap: {

        },
        userGachaCountCeilingMap: {

        },
        userBackstageTalkSetReadHistoryMap: {

        },
        userNewMusicIntroductionMap: {

        },
        userNewSituationIntroductionMap: {

        },
        userFriendRelationDetail: {
            applicationMap: {

            },
            approvalMap: {

            },
            friendMap: {

            },
            friendLimit: 50,
            approvalLimit: 50,
            applicationLimit: 50
        },
        userNotHaveViewExchangesMiracleTicketIdList: {

        },
        userProfileSituation: {

        },
        userProfileDegreeMap: {

        },
        userDecoFrameInventoryMap: {

        },
        userDecoPinsInventoryMap: {

        },
        userDecoEffectInventoryMap: {

        },
        userDecoEquipment: {
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
        },
        userMusicVideoListMap: {

        },
        userPurchaseMenuLastVisitMap: {

        },
        userSkinLaneMap: {

        },
        currentUserEventMusicScoresMap: {

        },
        currentUserEventMusicAchievementsMap: {

        },
        currentUserEventBoxGachaMap: {

        },
        userMonthlyPurchaseMap: {

        },
        userSubscriptionList: undefined,
        userCommentBannerList: {

        },
        userEventBoxGachaSpinSettings: {

        },
        userMorfonicaStoryList: {

        },
        userMatchingBonusList: {

        },
        userRaiseASuilenStoryList: {

        },
        userCollaboOriginalMusicScoreMap: {

        },
        userDailyLive: {

        },
        userDailyLiveTotalRewardHistory: {

        },
        userComebackStatus: {

        },
        userGraphicalInformationList: {

        },
        userMultiLiveCountRewardList: {

        },
        userDigestStoryList: {

        },
        userLiveBoostUseBonusLimitList: {

        },
        userReceivablePresentLocationList: {

        },
        userPanelMissionList: {

        },
        userBirthdayIntroductionMap: {

        },
        userFestivalTeamMap: {

        },
        userLimitedItemList: {

        },
        userDeckList: {

        },
        userAddMusicDifficultyIntroductionList: {

        },
        userGalleryList: {

        },
        userBandDeckRatingMap: {

        },
        updatedBandDeckRankList: {

        },
        userStageChallengeStageNoMap: {

        },
        userStageChallengeMap: {

        },
        userStageChallengeScoreMap: {

        },
        userStarSeal: {

        },
        userLiveBoostUseFull: {

        },
        userAutoLive: {

        },
        userMonthlyMission: {

        },
        userMonthlyMissionRewardList: {

        },
        userCharacterRankMap: {

        },
        userCharacterPotentialLevelMap: {

        },
        userMusicVideo3dListMap: {

        },
        userCostume3dDressInventoryMap: {

        },
        userCostume3dHairstyleInventoryMap: {

        },
        userWearingCostume3dMap: {

        },
        userMusicClearInfoMap: {

        },
        userMusicClearCountInfoMap: {

        },
        userCharacterSituationCountMap: {

        },
        userDecoCharacterBackgroundInventoryMap: {

        },
        userDecoCharacter3dMotionInventoryListMap: {

        },
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
        userStampVoiceMap: {

        },
        userEventRankedCountAppeal: {

        },
        userEventMusicRankedCountAppeal: {

        },
        userMyGoStoryList: {

        },
        userTerms: {

        },
        userCharacterMissionBonusMap: {

        },
        userPhotoStudioMap: {

        },
        userGachaSelfPickupSituationList: {

        },
        userPhotoBackInventoryMap: {

        },
        userLimitedSkinInventoryMap: {

        },
        userMusicClearCountDetailMap: {

        }

    }

    const message = SuiteUserGetResponse.fromJSON(data);
    const buffer = Buffer.from(SuiteUserGetResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.send(encBuffer);
})

export default router;