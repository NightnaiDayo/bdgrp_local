import { Router } from "express";
import { ServerSystem } from "@proto"
import { encrypt } from "@util/encrypt"

const router = Router()

router.get('/', (req, res) => {
    let offset;

    switch(process.env.SERVER) {
        case 'TW':
            offset = 28800000;
            break;
        case 'JP':
            offset = 32400000;
    }

    const data = {
        serverDate: String(Date.now()),
        timeZoneRawOffset: offset as number
    }

    const buffer = Buffer.from(ServerSystem.encode(data).finish());
    const enc = encrypt(buffer);

    res.send(enc);
})

export default router;