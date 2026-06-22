import { Router } from "express";
import { RegisterTimeOpenAreaResponse, SuiteMasterGetResponse } from "@proto";
import { encrypt } from "@util/encrypt";
import { getMaster } from "@master";


const router = Router({ mergeParams: true })

router.get('/', (req, res) => {
    // @ts-ignore
    const userid = req.params.userid

    const master = getMaster();

    const data = {
        registerTimeOpenAreaIdList: undefined,
        userAreaStatusMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterAreaMap.entries)
                    .filter(([_, area]) => area.areaType === "common")
                    .map(([areaId]) => [
                        Number(areaId),
                        {userId: userid, areaId: Number(areaId)}
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