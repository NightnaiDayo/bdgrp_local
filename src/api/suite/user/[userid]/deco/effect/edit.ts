import { Router } from "express";
import { saveDb, db } from "@db";
import {decrypt} from "@util/decrypt";
import { UserDecoEffectRequestBody, SuiteUserDecoCharacterSituation } from "@proto";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserDecoEffectRequestBody.decode(reqbuffer)

    user.decos.effect = decoded.decoEffectId

    saveDb()

    const data = {
        updateResources: {
            userDecoEquipment: {
                userDecoEffect: {
                    userId: Number(userid),
                    decoEffectId: user.decos.effect
                }
            }
        }
    }

    res.send(encrypt(Buffer.from(SuiteUserDecoCharacterSituation.encode(SuiteUserDecoCharacterSituation.fromJSON(data)).finish())))

})

export default router;