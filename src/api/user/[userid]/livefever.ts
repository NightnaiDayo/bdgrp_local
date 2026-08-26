import { Router } from "express";
import { UserLiveFeverCount } from "@proto";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    const data = {
        userId: String(req.params.userid),
        count: 67,
        inActivity: true,
        limit: 3
    }

    res.send(encrypt(Buffer.from(UserLiveFeverCount.encode(UserLiveFeverCount.fromJSON(data)).finish())))
})

export default router;