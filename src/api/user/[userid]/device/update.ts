import { Router } from "express";
import { DeviceInfoUpdateRequest } from "@proto";
import {decrypt} from "@util/decrypt";
import { saveDb, db } from "@db";

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

    res.send('')


})

export default router;