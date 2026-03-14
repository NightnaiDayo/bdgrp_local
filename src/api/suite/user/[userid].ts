import { Router } from "express";
import { decrypt } from "../../../../util/decrypt";
import { encrypt } from "../../../../util/encrypt";
import { SuiteUserGetResponse } from "../../../../proto/generated/allmsgs"
import { UserRegistrationModel } from "../../../model/userRegistration";
import { UserGamedataModel } from "../../../model/userGamedata";

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    const encReq = req.body;
    const buffer = decrypt(encReq);
    const decoded = SuiteUserGetResponse.decode(buffer);
    //@ts-ignore
    const userid = req.params.userid
    
    const userRegistration = await UserRegistrationModel.findOne({ userId: BigInt(userid) });
    const userGamedata = await UserGamedataModel.findOne({ userId: BigInt(userid) });

    const userCharacterMap: Record<number, any> = {};
    const userSituationMap:Record<number, any> = {};
    
    for(let i = 1; i <=40; i++) {
        userCharacterMap[i] = {
            userId: userid,
            characterId: i,
            costumeId: i >= 36 ? (1786 + (i - 36)) : (1607 + i)
        }
    }
    userCharacterMap[601] = {
        userId: userid,
        characterId: 601,
        costumeId: 1643
    }

    const data: SuiteUserGetResponse = {
        user: {
            userRegistration: userRegistration.toObject(),
            userGamedata: userGamedata.toObject()
        },
        userCharacterMap: userCharacterMap,
        userSituationMap: {
            userId
            situationId
            level
            exp
            createdAt
            addExp
            trainingStatus
            duplicateCount
            illust
            skillExp
            skillLevel
            userAppendParameter
            limitBreakRank
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
            friendLimit: ,
            approvalLimit: ,
            applicationLimit:
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

    const encoded = Buffer.from(SuiteUserGetResponse.encode(data).finish());
    const encBuffer = encrypt(encoded);

    res.send(encBuffer);
})

export default router;