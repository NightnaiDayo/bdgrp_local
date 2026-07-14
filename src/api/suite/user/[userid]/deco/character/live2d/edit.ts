import { Router } from "express";
import { saveDb, db } from "@db";
import {decrypt} from "@util/decrypt";
import { UserDecoCharacterLive2d, SuiteUserDecoCharacterLive2d } from "@proto";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserDecoCharacterLive2d.decode(reqbuffer)

    user.decos["live2d"] = {
        "characterId": decoded.characterId,
        "costumeId": decoded.costumeId,
        "motionId": decoded.motionId,
        "backgroundId": decoded.backgroundId
    }

    saveDb();

    const data = {
        updateResources: {
            userDecoEquipment: {
                userDecoCharacterLive2d: {
                    userId: Number(userid),
                    ...user.decos["live2d"]
                }
            }
        }
    }

    res.send(encrypt(Buffer.from(SuiteUserDecoCharacterLive2d.encode(SuiteUserDecoCharacterLive2d.fromJSON(data)).finish())))

})

export default router;