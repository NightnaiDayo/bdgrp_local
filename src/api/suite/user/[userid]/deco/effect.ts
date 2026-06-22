import { Router } from "express";
import {SuiteMasterGetResponse, UserDecoEquipmentGetResponse} from "@proto"
import { encrypt } from "@util/encrypt";
import { db } from "@db";
import { getMaster } from "@master";


const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    const master = getMaster();
    // @ts-ignore
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const mainDeck = user.decks[user.mainDeck - 1]
    const data = {
        updateResources: {
            userDecoEffectInventoryMap: {
                entries: {
                    "1": {
                        userId: req.params.userid,
                        decoEffectId: 1
                    }
                }
            },
            userDecoEquipment: {
                userDecoCharacterLive2d: {
                    userId: req.params.userid,
                    characterId: master.masterCharacterSituationMap.entries[mainDeck.leader].characterId ?? 1,
                    costumeId: user.wearingCostume[master.masterCharacterSituationMap.entries[mainDeck.leader].characterId].costumeId,
                    motionId: Object.values(master.masterDecoCharacterLive2dMotionMap.entries)
                        .filter(m => m.characterId === master.masterCharacterSituationMap.entries[mainDeck.leader].characterId)
                        .sort((a, b) => a.seq - b.seq)[0].motionId,
                    backgroundId: 1
                },
                userDecoEffect: {
                    userId: req.params.userid,
                    decoEffectId: 1
                }
            }
        }
    }

    res.send(encrypt(Buffer.from(UserDecoEquipmentGetResponse.encode(UserDecoEquipmentGetResponse.fromJSON(data)).finish())))
})

export default router;