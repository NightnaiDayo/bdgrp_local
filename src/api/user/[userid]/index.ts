import { Router } from "express";
import { UserGetResponse } from "@proto";
import { db, saveDb } from "@db"
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true })

router.get("/", async (req, res) => {
    // @ts-ignore
    const userId = req.params.userid;

    const user = db.Users.find((u: any) => u.userId === userId);

    if(!user) return res.status(404).send('')
    
    const data: UserGetResponse = {
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
    }


    const encoded = Buffer.from(UserGetResponse.encode(data).finish());
    console.log(data)
    const encBuffer = encrypt(encoded);

    res.send(encBuffer);

})

export default router;