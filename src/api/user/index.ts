import { Router } from "express";
import { UserPostRequest, UserRegistration } from "@proto";
import { encrypt } from "@util/encrypt"
import { decrypt } from "@util/decrypt";
import crypto from "crypto";
import { db, saveDb } from "@db"

const router = Router()

router.post('/', async (req, res) => {

        const encReq = req.body;
        const buffer = decrypt(encReq);
        console.log(buffer)
        const decoded = UserPostRequest.decode(buffer);

        const hash = crypto.randomUUID();
        const newUser = {
            userId: ((db.Users.at(-1)?.userId ?? 1000) as number) + 1,
            hash: hash,
            userName: "新人工作人員",
            clientVersion: decoded.clientVersion,
            platform: decoded.platform,
            deviceModel: decoded.deviceModel,
            operatingSystem: decoded.operatingSystem,
            birthMonth: "199001",
            tutorialStatus: "start",
            introduction: "你好！",
            unknownString: "standard",
            tutorialEndedAt: 0
        }

        const newGamedata = {
            rank: 1,
            exp: 0,
            coin: 114514,
            mainDeck: 1,
            paidStar: 0,
            freeStar: 0,
            seal: 0,
            degree: 100,
            publishTotalDeckPowerFlg: false,
            publishBandRankFlg: false,
            publishMusicClearedFlg: false,
            publishMusicFullComboFlg: false,
            publishHighScoreRatingFlg: false,
            pooledExp: 0,
            totalExp: 0,
            nextExp: 0,
            publishUpdatedAtFlg: true,
            startDashLoginBonusReceiveFlg: false,
            publishMusicAllPerfectFlg: false,
            publishDeckRankFlg: false,
            publishStageAchievementConditionsFlg: false,
            publishStageFriendRankingFlg: true,
            publishCharacterRankFlg: false,
            loginDays: 0
        };
        db.Users.push({ ...newUser, ...newGamedata });
        saveDb();

        const data = {
            userId: String(newUser.userId),
            hash: newUser.hash,
            userName: newUser.userName,
            clientVersion: newUser.clientVersion ?? '',
            platform: newUser.platform ?? '',
            deviceModel: newUser.deviceModel ?? '',
            operatingSystem: newUser.operatingSystem ?? '',
            birthMonth: newUser.birthMonth,
            tutorialStatus: newUser.tutorialStatus,
            introduction: newUser.introduction,
            unknownString: newUser.unknownString,
            tutorialEndedAt: String(newUser.tutorialEndedAt)
        }

        const encoded = Buffer.from(UserRegistration.encode(data).finish());
        const encBuffer = encrypt(encoded);

        res.send(encBuffer);

});

export default router;