import { Router } from "express";
import { UserPostRequest, UserRegistration } from "../../../proto/generated/allmsgs";
import { UserRegistrationModel } from "../../../model/userRegistration";
import { UserGamedataModel } from "../../../model/userGamedata";
import { Counter } from "../../../model/counter";
import { encrypt } from "../../../util/encrypt"
import { decrypt } from "../../../util/decrypt";
import crypto from "crypto";

const router = Router()

router.post('/', async (req, res) => {

        const encReq = req.body;
        const buffer = decrypt(encReq);
        const decoded = UserPostRequest.decode(buffer);

        const hash = crypto.randomUUID();

        const counter = await Counter.findOneAndUpdate(
            { name: 'userId' },
            { $inc: { seq: 1n } },
            { returnDocument: 'after', upsert: true }
        );

        const newUser = new UserRegistrationModel({
            userId: counter.seq,
            hash: hash,
            clientVersion: decoded.clientVersion,
            platform: decoded.platform,
            deviceModel: decoded.deviceModel,
            operatingSystem: decoded.operatingSystem
        });

        const newGamedata = new UserGamedataModel({
            userId: counter.seq
        });

        await newGamedata.save()
        await newUser.save();

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
            tutorialEndedAt: '0'
        }

        const encoded = Buffer.from(UserRegistration.encode(data).finish());
        const encBuffer = encrypt(encoded);

        res.send(encBuffer);

});

export default router;