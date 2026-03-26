import { Router } from "express";
import { UserGetResponse } from "../../../../proto/generated/allmsgs";
import { UserRegistrationModel } from "../../../../model/userRegistration";
import { UserGamedataModel } from "../../../../model/userGamedata";
import { encrypt } from "../../../../util/encrypt";

const router = Router({ mergeParams: true })

router.get("/", async (req, res) => {
    // @ts-ignore
    const userId = BigInt(req.params.userid)

    const userRegistration = await UserRegistrationModel.findOne({ userId });
    const userGamedata = (await UserGamedataModel.findOne({ userId }))!;

    if(!userRegistration) return res.status(404).send('')

    if(!userGamedata) {}
    
    const data: UserGetResponse = {
        userRegistration: {
            userId: String(userRegistration.userId),
            hash: userRegistration.hash,
            userName: userRegistration.userName,
            clientVersion: userRegistration.clientVersion ?? '',
            platform: userRegistration.platform ?? '',
            deviceModel: userRegistration.deviceModel ?? '',
            operatingSystem: userRegistration.operatingSystem ?? '',
            birthMonth: userRegistration.birthMonth,
            tutorialStatus: userRegistration.tutorialStatus,
            introduction: userRegistration.introduction,
            unknownString: userRegistration.unknownString,
            tutorialEndedAt: String(userRegistration.tutorialEndedAt)
        },
        userGamedata: {
            userId: String(userGamedata.userId),
            rank: userGamedata.rank,
            exp: userGamedata.exp,
            coin: String(userGamedata.coin),
            mainDeck: userGamedata.mainDeck,
            paidStar: userGamedata.paidStar,
            freeStar: userGamedata.freeStar,
            seal: userGamedata.seal,
            degree: userGamedata.degree,
            publishTotalDeckPowerFlg: userGamedata.publishTotalDeckPowerFlg,
            publishBandRankFlg: userGamedata.publishBandRankFlg,
            publishMusicClearedFlg: userGamedata.publishMusicClearedFlg,
            publishMusicFullComboFlg: userGamedata.publishMusicFullComboFlg,
            publishHighScoreRatingFlg: userGamedata.publishHighScoreRatingFlg,
            pooledExp: String(userGamedata.pooledExp),
            totalExp: String(userGamedata.totalExp),
            nextExp: userGamedata.nextExp,
            publishUpdatedAtFlg: userGamedata.publishUpdatedAtFlg,
            userPaidStarRecallResponse: undefined,
            startDashLoginBonusReceiveFlg: userGamedata.startDashLoginBonusReceiveFlg,
            publishMusicAllPerfectFlg: userGamedata.publishMusicAllPerfectFlg,
            publishDeckRankFlg: userGamedata.publishDeckRankFlg,
            publishStageAchievementConditionsFlg: userGamedata.publishStageAchievementConditionsFlg,
            publishStageFriendRankingFlg: userGamedata.publishStageFriendRankingFlg,
            publishCharacterRankFlg: userGamedata.publishCharacterRankFlg,
            loginDays: userGamedata.loginDays
        }
    }


    const encoded = Buffer.from(UserGetResponse.encode(data).finish());
    console.log(data)
    const encBuffer = encrypt(encoded);

    res.send(encBuffer);

})

export default router;