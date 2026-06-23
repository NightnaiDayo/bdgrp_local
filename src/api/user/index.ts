import { Router } from "express";
import { UserPostRequest, UserRegistration } from "@proto";
import { encrypt } from "@util/encrypt"
import { decrypt } from "@util/decrypt";
import crypto from "crypto";
import { db, saveDb } from "@db"
import {getMaster, reloadMaster} from "@master";
import axios from "axios";
import fs from "fs";
import path from "path";

const router = Router()

router.post('/', async (req, res) => {

        const encReq = req.body;
        const buffer = decrypt(encReq);
        const decoded = UserPostRequest.decode(buffer);

        const hash = crypto.randomUUID();
        const newUser = {
            userId: ((db.Users[process.env.SERVER].at(-1)?.userId ?? 1000) as number) + 1,
            hash: hash,
            userName: process.env.SERVER == "TW" ? "新人工作人員" : "新人スタッフ",
            clientVersion: decoded.clientVersion,
            platform: decoded.platform,
            deviceModel: decoded.deviceModel,
            operatingSystem: decoded.operatingSystem,
            birthMonth: "199001",
            tutorialStatus: "end",
            introduction: process.env.SERVER == "TW" ? "你好！" : "よろしくお願いします！",
            unknownString: "standard",
            tutorialEndedAt: Date.now()
        }

        const newGamedata = {
            rank: 114,
            exp: 67,
            coin: 114514,
            mainDeck: 1,
            paidStar: 0,
            freeStar: 514,
            seal: 0,
            degree: [100, null],
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
            loginDays: 0,
            useProfileSettingDegree: true,
            useProfileSettingSituation: true,
            selectedCharacterType: "character_situation"
        };
        db.Users[process.env.SERVER].push({ ...newUser, ...newGamedata });
        saveDb();

        const data = {
            userId: String(newUser.userId),
            hash: newUser.hash,
            userName: newUser.userName,
            clientVersion: newUser.clientVersion ?? '',
            platform: newUser.platform ?? '',
            deviceModel: newUser.deviceModel ?? '',
            operatingSystem: newUser.operatingSystem ?? '',
            tutorialStatus: newUser.tutorialStatus,
            introduction: newUser.introduction,
            unknownString: newUser.unknownString,
            tutorialEndedAt: String(newUser.tutorialEndedAt)
        }

        const encoded = Buffer.from(UserRegistration.encode(UserRegistration.fromJSON(data)).finish());
        const encBuffer = encrypt(encoded);

        res.send(encBuffer);

        let baseUrl;
        switch(process.env.SERVER) {
            case 'TW':
                baseUrl = 'https://v940-bd.mobimon.com.tw';
                break;
            case 'JP':
                baseUrl = 'https://api.garupa.jp'
                break;
        }

        let master = getMaster();
        if(!master) {
            const d = await axios.get(`${baseUrl}/api/suite/master`, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': req.get("User-Agent") as string,
                    'Content-Type': req.get("Content-Type") as string,
                    'Accept': req.get("Accept") as string,
                    'Accept-Encoding': req.get("Accept-Encoding") as string,
                    'x-clientversion': req.get("x-clientversion") as string,
                }
            });
            fs.writeFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "suitemaster.bz2")}`, Buffer.from(d.data));
            reloadMaster()
        }

});

export default router;