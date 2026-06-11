import { Router } from "express";
import { SuiteUserFriendTopResponse } from "@proto"
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    const data = {
        updateResources: {
            userFriendRelationDetail: {
                applicationMap: {},
                approvalMap: {},
                friendMap: {},
                friendLimit: 60,
                approvalLimit: 50,
                applicationLimit: 50
            }
        },
        userFriendDetail: {
            applicationMap: {},
            approvalMap: {},
            friendMap: {},
            applicationLimit: 50,
            approvalLimit: 50,
            friendLimit: 60,
        }
    }

    const message = SuiteUserFriendTopResponse.fromJSON(data);
    const buffer = Buffer.from(SuiteUserFriendTopResponse.encode(message).finish());
    const encBuffer = encrypt(buffer)

    res.send(encBuffer)
})

export default router;