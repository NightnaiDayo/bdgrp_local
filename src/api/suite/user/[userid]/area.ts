import { Router } from "express";
import { UserAreaCharacterResponse } from "@proto";
import { encrypt } from "@util/encrypt";
import areas from "@gamedata/areas.json"
import actionSets from "@gamedata/actionSets.json"

const router = Router()

router.get('/', (req, res) => {

    const data = {
        userAreaMap: {
            entries: Object.fromEntries(
                areas.areas.map((areaId: number) => [
                    String(areaId),
                    {
                        areaId,
                        actionSets: (() => {
                            // @ts-ignore
                            const available = actionSets[String(areaId)] || [];
                            const count = Math.min(available.length, Math.floor(Math.random() * 7) + 1);
                            const shuffled = [...available];
                            for (let i = shuffled.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                            }
                            return shuffled.slice(0, count).map(id => ({ actionSetId: id, status: "already_read" }));
                        })()
                    }
                ])
            )
        },
        backstage: undefined,
        userSeason: {
            seasonId: 37
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