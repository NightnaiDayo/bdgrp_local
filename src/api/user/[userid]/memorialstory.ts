import { Router } from "express";
import { UserEventStoryMemorialResponse } from "@proto";
import { getMaster } from "@master";
import {encrypt} from "@util/encrypt";
import fs from "fs";
import path from "path";

const router = Router({ mergeParams: true });

router.get('/', async(req, res) => {
    const userid = req.params.userid;

    const master = getMaster();

    const past = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pastEvents", `${process.env.SERVER}.json`), 'utf-8'));

    const data = {
        userEventStoryMemorialMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterEventStoryMemorialConfigMap.entries).map(([eventId, config]: [string, any]) => [
                    eventId,
                    {
                        eventId: Number(eventId),
                        userEventStoryList: {
                            entries: Array.from({ length: past.pastEventStoryMap.entries[String(eventId)]?.entries?.length }, (_, i) => ({
                                userId: userid,
                                eventId: Number(eventId),
                                seq: i,
                                status: "already_read"
                            }))
                        },
                        isExistUnReadStory: false,
                        isLocked: false
                    }
                ])
            )
        },
        ...past
    }

    res.send(encrypt(Buffer.from(UserEventStoryMemorialResponse.encode(UserEventStoryMemorialResponse.fromJSON(data)).finish())))
})

export default router;