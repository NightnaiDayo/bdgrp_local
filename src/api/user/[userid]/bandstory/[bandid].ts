import { Router } from "express";
import { UserBandStoryList } from "@proto";
import { encrypt } from "@util/encrypt";
import * as stories from "@gamedata/stories"

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    // @ts-ignore
    const userid = req.params.userid

    const bandMap: Record<number, any> = {
        1: stories.ppp,
        2: stories.afterglow,
        3: stories.hhw,
        4: stories.paspal,
        5: stories.roselia,
        18: stories.ras,
        21: stories.morfonica,
        45: stories.mygo,
    };

    const entries = Object.values(bandMap[req.params.bandid]).map((story: any) => ({
        userId: userid,
        bandStoryId: story.bandStoryId,
        bandId: story.bandId,
        status: "already_read",
        seq: story.seq
    }))

    const data = { entries }

    const buffer = Buffer.from(UserBandStoryList.encode(data).finish());
    const encBuffer = encrypt(buffer)

    res.send(encBuffer)
})

export default router;