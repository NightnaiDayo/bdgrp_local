import { Router } from "express";
import { decrypt } from "../../../../util/decrypt";
import { encrypt } from "../../../../util/encrypt";
import { SuiteUserGetResponse } from "../../../../proto/generated/allmsgs"
import { UserRegistrationModel } from "../../../model/userRegistration";
import { UserGamedataModel } from "../../../model/userGamedata";
import cards from "../../../../cards.json";
import { UserSituationModel } from "../../../../model/userSituation";

const router = Router({ mergeParams: true })

function cardLevel(rarity: Number) {
    switch(rarity) {
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
}

const card = {
    level(rarity: Number) {
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
    trainingStatus(rarity: Number) {
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
    illust(rarity: Number) {
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
    const encReq = req.body;
    const buffer = decrypt(encReq);
    const decoded = SuiteUserGetResponse.decode(buffer);
    //@ts-ignore
    const userid = req.params.userid
    
    const userRegistration = await UserRegistrationModel.findOne({ userId: BigInt(userid) });
    const userGamedata = await UserGamedataModel.findOne({ userId: BigInt(userid) });
    const userSituation = await UserSituationModel.findOne({ userId: BigInt(userid) });

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
    for(const [index, card] of cards.situations.entries()) {
        const situationId = Number(card.situationId);

        userSituationMap[situationId] = {
            userId: userid,
            situationId,
            level: ,
            exp: 0,
            createdAt: ,
            addExp: 0,
            trainingStatus: ,
            duplicateCount: ,
            illust: ,
            skillExp: ,
            skillLevel: ,
            limitBreakRank: ,
        }
    }

    const data: SuiteUserGetResponse = {
        user: {
            userRegistration: userRegistration.toObject(),
            userGamedata: userGamedata.toObject()
        },
        userCharacterMap: userCharacterMap,
        userSituationMap: userSituationMap,
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