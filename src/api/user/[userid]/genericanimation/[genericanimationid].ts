import { Router } from "express";
import { SuiteUserGetResponse } from "@proto";
import { encrypt } from "@util/encrypt"
import { decrypt } from "@util/decrypt";
import {getMaster} from "@master";
import User from "../../index";

const router = Router({ mergeParams: true })

router.post('/', async (req, res) => {

    const encReq = req.body;
    const buffer = decrypt(encReq);

    const master = getMaster()

    const data = {
        userGenericAnimationMap: {
            entries: Object.fromEntries(
                Object.keys(master.masterGenericAnimationMap.entries).map((genericAnimationId: any) => [
                    Number(genericAnimationId),
                    {
                        userId: req.params.userid,
                        genericAnimationId: Number(genericAnimationId),
                        status: "already_read"
                    }
                ])
            )
        }
    }

    res.send(encrypt(Buffer.from(SuiteUserGetResponse.encode(SuiteUserGetResponse.fromJSON(data)).finish())));
})

export default router;
