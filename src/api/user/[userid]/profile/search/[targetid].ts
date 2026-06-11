import { Router } from "express";
import { UserProfileSearchResponse } from "@proto";
import { db } from "@db";
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true });

router.put('/', async(req, res) => {
    // @ts-ignore
    // const targetid = req.params.targetid
    // const user = db.Users[process.env.SERVER].find((u: any) => u.userId == targetid);

    const data = {
        userProfile: undefined,
        searchSuccessFlg: false
    }

    const message = UserProfileSearchResponse.fromJSON(data);
    const buffer = Buffer.from(UserProfileSearchResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.send(encBuffer)
})

export default router;