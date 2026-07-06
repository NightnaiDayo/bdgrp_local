import { Router } from "express";
import { UserAuthRequest, ClientErrorResponse } from "@proto";
import {decrypt} from "@util/decrypt";
import {db} from "@db";
import crypto from "crypto";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', (req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserAuthRequest.decode(reqbuffer)
    // console.log(decoded)
    const hash = crypto.createHash("sha1").update(`${String(userid)}:`, "utf8").digest("hex")
    const data = {
        httpStatus: 403,
        errorCode: "",
        errorMessage: "signature invalid."
    }

    if(hash != decoded.hash1 || !user) {
        res.status(403).send(encrypt(Buffer.from(ClientErrorResponse.encode(ClientErrorResponse.fromJSON(data)).finish())))
    } else {
        if(req.headers['x-signature'] != user.hash) {
            res.status(403).send(encrypt(Buffer.from(ClientErrorResponse.encode(ClientErrorResponse.fromJSON(data)).finish())))
        } else {
            res.send('')
        }
    }


})

export default router;