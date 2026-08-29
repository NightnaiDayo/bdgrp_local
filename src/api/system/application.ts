import { Router } from "express";
import { ServerSystem } from "@proto"
import { encrypt } from "@util/encrypt"

const router = Router()

router.get('/', (req, res) => {
    let offset;

    switch(process.env.SERVER) {
        case 'TW':
        case 'CN':
            offset = 28800000;
            break;
        case 'JP':
            offset = 32400000;
            break;
        case 'GL':
            offset = 0;
            break;
    }

    const data = {
        serverDate: String(Date.now() + 97200000),
        timeZoneRawOffset: offset as number
    }

    const buffer = Buffer.from(ServerSystem.encode(data).finish());
    const enc = encrypt(buffer);

    res.send(enc);
})

export default router;
