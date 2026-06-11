import { Router } from "express";
import { UserPresentHistoryList } from "@proto";
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    const data = {
        pagination: {
            start: 9223372036854775807,
            limit: req.query.limit,
            record: 0
        }
    }

    res.send(encrypt(Buffer.from(UserPresentHistoryList.encode(UserPresentHistoryList.fromJSON(data)).finish())))
})

export default router;