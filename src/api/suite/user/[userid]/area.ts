import { Router } from "express";
import {SuiteMasterGetResponse, UserAreaCharacterResponse} from "@proto";
import { encrypt } from "@util/encrypt";
import { getMaster } from "@master";
import {db} from "@db";


const router = Router({ mergeParams: true })

router.get('/', (req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    // @ts-ignore
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == String(userid));
    const master = getMaster();
    const data = {
        userAreaMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterAreaMap.entries)
                    .filter(([_, area]: [string, any]) => area.areaType === "common")
                    .map(([areaId]) => {
                        const available = Object.values(master.masterActionSetMap.entries)
                            .filter((a: any) => String(a.areaId) === areaId)
                            .map((a: any) => a.actionSetId);
                        const count = Math.min(available.length, Math.floor(Math.random() * 3) + 1);
                        const shuffled = [...available].sort(() => Math.random() - 0.5);
                        return [
                            Number(areaId),
                            {
                                areaId: Number(areaId),
                                actionSets: shuffled.slice(0, count).map(id => ({ actionSetId: id, status: "already_read" })),
                                areaItemIds: user.areaItems[areaId] ?? []
                            }
                        ];
                    })
            )
        },
        backstage: undefined,
        userSeason: {
            seasonId: (() => {
                const now = Date.now();
                const entries = Object.values(master.masterSeasonBasicMap.entries) as any[];
                const current = entries.find(s => Number(s.startAt) <= now && now < Number(s.endAt));
                return current?.seasonId;
            })()
        },
        userLotterySelectedBackstageTalkSetMap: undefined
    }

    const message = UserAreaCharacterResponse.fromJSON(data);
    const buffer = Buffer.from(UserAreaCharacterResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.removeHeader('Content-Length');
    res.removeHeader('Transfer-Encoding');
    res.setHeader('content-type', 'application/octet-stream');

    res.writeHead(200);
    res.write(encBuffer);
    res.end();
})

export default router;