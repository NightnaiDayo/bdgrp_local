import { Router } from "express";
import { ServerSystem } from "../../../proto/generated/allmsgs"
import { encrypt } from "../../../util/encrypt"

const router = Router()

router.get('/', (req, res) => {
    const data = {
        serverDate: Date.now(),
        timeZoneRawOffset: 28800000
    }

    const buffer = Buffer.from(ServerSystem.encode(data).finish());
    const enc = encrypt(buffer);

    res.send(enc);
})

export default router;