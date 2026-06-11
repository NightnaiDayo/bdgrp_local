import { Router } from "express";
import {UserMusicContinueRequest, UserMusicContinueResponse, UserPutRequest} from "@proto"
import {db} from "@db";
import crypto from "crypto";
import {encrypt} from "@util/encrypt";
import {decrypt} from "@util/decrypt";

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserMusicContinueRequest.decode(reqbuffer)

    // @ts-ignore
    const userid = req.params.userid;

    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);

    const data = {
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
        },
        // @ts-ignore
        continueHash: crypto.createHash("sha1").update(`${String(userid) + decoded.continueCount.toString() + decoded.continueTime.toString()}`, "utf8").digest("hex")
    }

    const message = UserMusicContinueResponse.fromJSON(data);
    const buffer = Buffer.from(UserMusicContinueResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.send(encBuffer)
})

export default router;