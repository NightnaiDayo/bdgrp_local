import { Router } from "express";
import { SuiteUserFriendRelationResponse } from "@proto"
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    const data = {
        updateResources: {
            userFriendRelationDetail: {
                applicationMap: undefined,
                approvalMap: undefined,
                friendMap: undefined,
                friendLimit: 50,
                approvalLimit: 50,
                applicationLimit: 50
            }
        }
    }

    const message = SuiteUserFriendRelationResponse.fromJSON(data);
    const buffer = Buffer.from(SuiteUserFriendRelationResponse.encode(message).finish());
    const encBuffer = encrypt(buffer)

    res.send(encBuffer)
})

export default router;