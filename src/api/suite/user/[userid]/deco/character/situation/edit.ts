import { Router } from "express";
import { saveDb, db } from "@db";
import {decrypt} from "@util/decrypt";
import { UserDecoCharacterSituation, SuiteUserDecoCharacterSituation } from "@proto";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserDecoCharacterSituation.decode(reqbuffer)

    user.decos["situation"] = {
        "situationId": decoded.situationId,
        "situationStatus": decoded.situationStatus,
        "useProfileSetting": decoded.useProfileSetting
    }

    saveDb();

    const data = {
        updateResources: {
            userDecoEquipment: {
                userDecoCharacterSituation: {
                    userId: Number(userid),
                    ...user.decos["situation"]
                }
            }
        }
    }

    res.send(encrypt(Buffer.from(SuiteUserDecoCharacterSituation.encode(SuiteUserDecoCharacterSituation.fromJSON(data)).finish())))

})

export default router;