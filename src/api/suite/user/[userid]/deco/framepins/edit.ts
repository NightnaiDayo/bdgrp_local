import { Router } from "express";
import { saveDb, db } from "@db";
import {decrypt} from "@util/decrypt";
import { UserDecoFramePinsRequestBody, DecoFramePinsResponse } from "@proto";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserDecoFramePinsRequestBody.decode(reqbuffer)

    let pins = []

    for(let i = 0; i < 5; i++) {
        const field = `decoPinsId${i+1}` as keyof typeof decoded
        const val = decoded[field]

        if (val && val > 0) {
            pins[i] = val
        } else {
            pins[i] = 0;
        }
    }

    user.decos["framepins"] = pins;
    user.decos["frameId"] = decoded.decoFrameId

    saveDb();

    const framepin = {
        "userId": userid,
        "decoFrameId": user.decos.frameId,
        "decoPinsId1": user.decos["framepins"][0],
        "decoPinsId2": user.decos["framepins"][1],
        "decoPinsId3": user.decos["framepins"][2],
        "decoPinsId4": user.decos["framepins"][3],
        "decoPinsId5": user.decos["framepins"][4],
    }

    const data = {
        updateResources: {
            userDecoEquipment: {
                userDecoFramePins: framepin
            }
        }
    }

    res.send(encrypt(Buffer.from(DecoFramePinsResponse.encode(DecoFramePinsResponse.fromJSON(data)).finish())))

})

export default router;