import { Router } from "express";
import { UserPresentList } from "@proto";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    const data = {
        pagination: {
            start: 9223372036854775807,
            limit: req.query.limit,
            record: 0
        }
    }

    res.send(encrypt(Buffer.from(UserPresentList.encode(UserPresentList.fromJSON(data)).finish())))
})

export default router;