import { Router } from "express";
import { SuiteUserCharacter } from "@proto";
import { saveDb, db } from "@db";
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true });

router.put('/', async(req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    // @ts-ignore
    const costumeid = req.params.costumeid
    // @ts-ignore
    const characterid = req.params.characterid

    user.wearingCostume[String(characterid)].costumeId = Number(costumeid)

    saveDb();

    const data = {
        updateResources: {
            userCharacterMap: {
                entries: Object.fromEntries(
                    Object.entries(user.wearingCostume).map(([charId, costume]: [string, any]) => [
                        String(charId),
                        {
                            userId: userid,
                            characterId: Number(charId),
                            costumeId: costume.costumeId
                        }
                    ])
                )
            }
        },
        userCharacter: {
            userId: userid,
            characterId: characterid,
            costumeId: costumeid
        }
    }

    const message = SuiteUserCharacter.fromJSON(data)
    const buffer = Buffer.from(SuiteUserCharacter.encode(message).finish())
    const encBuffer = encrypt(buffer)

    res.send(encBuffer)
})

export default router;