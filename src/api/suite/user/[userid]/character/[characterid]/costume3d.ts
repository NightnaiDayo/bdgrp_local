import { Router } from "express";
import { UserWearingCostume3d, SuiteUserCostume3dChangeResponse } from "@proto";
import { decrypt } from "@util/decrypt";
import { saveDb, db } from "@db";
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true });

router.put('/', async(req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserWearingCostume3d.decode(reqbuffer)

    user.wearingCostume[String(decoded.characterId)].dressId = decoded.costume3dDressId
    user.wearingCostume[String(decoded.characterId)].hairstyleId = decoded.costume3dHairstyleId

    saveDb();

    const data = {
        updateResources: {
            userWearingCostume3dMap: {
                entries: Object.fromEntries(
                    Object.entries(user.wearingCostume).map(([charId, costume]: [string, any]) => [
                        String(charId),
                        {
                            characterId: Number(charId),
                            costume3dDressId: costume.dressId,
                            costume3dHairstyleId: costume.hairstyleId
                        }
                    ])
                )
            }
        },
        userWearingCostume3d: {
            characterId: decoded.characterId,
            costume3dDressId: decoded.costume3dDressId,
            costume3dHairstyleId: decoded.costume3dHairstyleId
        }
    }

    const message = SuiteUserCostume3dChangeResponse.fromJSON(data)
    const buffer = Buffer.from(SuiteUserCostume3dChangeResponse.encode(message).finish())
    const encBuffer = encrypt(buffer)

    res.send(encBuffer)
})

export default router;