import { Router } from "express";
import { NgWordResponse } from "@proto"
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.post('', async(req, res) => {
    const data = {
        isBadWord: false
    }
    res.send(encrypt(Buffer.from(NgWordResponse.encode(data).finish())))
})

export default router;