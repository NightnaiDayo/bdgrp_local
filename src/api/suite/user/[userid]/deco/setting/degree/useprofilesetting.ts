import { Router } from "express";
import { UserDecoDegreeUseProfileSettingRequest, UserDecoEquipmentGetResponse } from "@proto"
import { decrypt } from "@util/decrypt";
import { saveDb, db } from "@db";
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    const decoded = UserDecoDegreeUseProfileSettingRequest.decode(decrypt(req.body))
    // @ts-ignore
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);

    user.useProfileSettingDegree = decoded.useProfileSettingDegree
    saveDb()

    const data = {
        updateResources: {
            userDecoEquipment: {
                userDecoSetting: {
                    useProfileSettingDegree: user.useProfileSettingDegree,
                    useProfileSettingSituation: user.useProfileSettingSituation,
                    selectedCharacterType: user.selectedCharacterType
                }
            }
        }
    }

    res.send(encrypt(Buffer.from(UserDecoEquipmentGetResponse.encode(UserDecoEquipmentGetResponse.fromJSON(data)).finish())))

})

export default router