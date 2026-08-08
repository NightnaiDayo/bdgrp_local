import { Router } from "express";
import { UserActionSetAlbumMap } from "@proto";
import { getMaster } from "@master";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true });

router.get('/', async(req, res) => {
    const master = getMaster();

    const data = {
        entries: Object.fromEntries(
            Object.entries(master.masterActionSetMap.entries)
                .filter(([_, item]: any) =>
                    item?.characterIds?.includes(Number(req.params.characterid))
                )
                .map(([key, item]: any) => [
                    key,
                    {
                        actionSetId: Number(key),
                        balloonText: item.balloonText,
                        ...(item.endSeason !== undefined && { isMemorial: true })
                    }
                ])
        )
    }

    res.send(encrypt(UserActionSetAlbumMap.encode(UserActionSetAlbumMap.fromJSON(data)).finish()));
})

export default router;