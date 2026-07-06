import { Router } from "express";
import { DeviceInfoUpdateRequest, UserRegistration } from "@proto";
import { decrypt } from "@util/decrypt";
import { saveDb, db } from "@db";
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', (req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = DeviceInfoUpdateRequest.decode(reqbuffer)

    user.deviceModel = decoded.deviceModel
    user.operatingSystem = decoded.operatingSystem;

    saveDb();

    const data = {
        deviceModel: user.deviceModel,
        operatingSystem: user.operatingSystem,
        clientVersion: user.clientVersion
    }

    res.send(encrypt(Buffer.from(UserRegistration.encode(UserRegistration.fromJSON(data)).finish())))
})

export default router;