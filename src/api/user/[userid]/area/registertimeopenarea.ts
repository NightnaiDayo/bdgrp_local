import { Router } from "express";
import { RegisterTimeOpenAreaResponse } from "@proto";
import areas from "@gamedata/areas.json";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.get('/', (req, res) => {
    // @ts-ignore
    const userid = req.params.userid

    const a = []

    areas.areas.map((areaId: number) => a.push(areaId))

    const data = {
        registerTimeOpenAreaIdList: [],
        userAreaStatusMap: {
            entries: Object.fromEntries(
                areas.areas.map((areaId: number) => [
                    String(areaId),
                    { userId: userid, areaId }
                ])
            )
        }
    }

    const message = RegisterTimeOpenAreaResponse.fromJSON(data);
    const buffer = Buffer.from(RegisterTimeOpenAreaResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.send(encBuffer)
})

export default router;