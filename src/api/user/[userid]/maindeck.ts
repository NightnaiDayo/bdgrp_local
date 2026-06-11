import { Router } from "express";
import { UserPutRequest } from "@proto";
import { saveDb, db } from "@db";
import {decrypt} from "@util/decrypt";

const router = Router({ mergeParams: true });

router.put('/', async(req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserPutRequest.decode(reqbuffer)

    user.mainDeck = Number(decoded.mainDeck)

    saveDb();

    res.send()
})

export default router;