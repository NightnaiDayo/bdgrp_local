import { Router } from "express";
import {SuiteMasterGetResponse, UserBandStoryList} from "@proto";
import { encrypt } from "@util/encrypt"
import {decrypt} from "@util/decrypt";
import fs from "fs";
import path from "path";
// @ts-ignore
import bzip2 from 'seek-bzip'

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    // @ts-ignore
    const userid = req.params.userid

    const master = SuiteMasterGetResponse.toJSON(SuiteMasterGetResponse.decode(bzip2.decode(decrypt(fs.readFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "suitemaster.bz2")}`)))))

    const bandStoryMap: Record<number, any> = {
        1: master.masterPoppinPartyStoryMap,
        2: master.masterAfterglowStoryMap,
        3: master.masterHelloHappyWorldStoryMap,
        4: master.masterPastelPalettesStoryMap,
        5: master.masterRoseliaStoryMap,
        18: master.masterRaiseASuilenStoryMap,
        21: master.masterMorfonicaStoryMap,
        45: master.masterMyGoStoryMap,
    };

    const entries = Object.values(bandStoryMap[req.params.bandid]).map((story: any) => ({
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