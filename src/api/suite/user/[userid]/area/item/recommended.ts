import { Router } from "express";
import {PutAreaItemRequestBody, SuiteMasterGetResponse, SuiteUserChangeAreaItemResponse} from "@proto"
import {decrypt} from "@util/decrypt";
import { saveDb, db } from "@db";
import {encrypt} from "@util/encrypt";
import { getMaster } from "@master";

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    // @ts-ignore
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = PutAreaItemRequestBody.decode(reqbuffer)
    const master = getMaster();
    let items: any = {}

    for (const id of decoded.areaItemIdList) {
        const areaId = master.masterAreaItemMap.entries[id].areaId;

        items[areaId] ||= [];
        items[areaId].push(id);
    }
    user.areaItems = items
    saveDb();

    const data = {
        updateResources: {},
        userAreaList: {
            entries: Object.entries(master.masterAreaMap.entries)
                .filter(([_, area]) => area.areaType === "common")
                .map(([areaId]) => {
                    const available = Object.values(master.masterActionSetMap.entries)
                        .filter((a: any) => String(a.areaId) === areaId)
                        .map((a: any) => a.actionSetId);
                    const count = Math.min(available.length, Math.floor(Math.random() * 3) + 1);
                    const shuffled = [...available].sort(() => Math.random() - 0.5);
                    return {
                        areaId: Number(areaId),
                        actionSets: shuffled.slice(0, count).map(id => ({ actionSetId: id, status: "already_read" })),
                        areaItemIds: user.areaItems[Number(areaId)] ?? []
                    };
                })
        }
    }

    res.send(encrypt(Buffer.from(SuiteUserChangeAreaItemResponse.encode(SuiteUserChangeAreaItemResponse.fromJSON(data)).finish())))

})

export default router;