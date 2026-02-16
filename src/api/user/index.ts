import { Router } from "express";
import { UserPostRequest, UserRegistration } from "../../../proto/generated/allmsgs";
import { openDb } from "../../../util/db";
import { encrypt } from "../../../util/encrypt"
import { decrypt } from "../../../util/decrypt";
import crypto from "crypto";

const router = Router()

router.post('/', async (req, res) => {
    let db;  // 先宣告變數

    try {
        db = await openDb();

        const encReq = req.body;
        const buffer = decrypt(encReq);
        const decoded = UserPostRequest.decode(buffer)

        const hash = crypto.randomUUID();

        const result = await db.run(
            `INSERT INTO UserRegistration (hash, clientVersion, platform, deviceModel, operatingSystem)
             VALUES (?, ?, ?, ?, ?)`,
            [hash, decoded.clientVersion, decoded.platform, decoded.deviceModel, decoded.operatingSystem]
        );

        const newUser = await db.get(
            'SELECT * FROM UserRegistration WHERE userId = ?',
            result.lastID
        )

        const data = {
            userId: BigInt(newUser.userId),
            hash: newUser.hash,
            userName: newUser.userName,
            clientVersion: newUser.clientVersion,
            platform: newUser.platform,
            deviceModel: newUser.deviceModel,
            operatingSystem: newUser.operatingSystem,
            tutorialStatus: newUser.tutorialStatus,
            introduction: newUser.introduction,
            unknownString: newUser.unknownString,
            tutorialEndedAt: BigInt(newUser.tutorialEndedAt)
        }

        const encoded = UserRegistration.encode(data).finish();
        const encBuffer = encrypt(encoded);

        res.send(encBuffer)

    } catch (error) {
        console.error('處理失敗:', error);
        res.status(500).send('');

    } finally {
        // 無論成功失敗，都要關閉資料庫連線
        if (db) {
            await db.close();
        }
    }
});

export default router;