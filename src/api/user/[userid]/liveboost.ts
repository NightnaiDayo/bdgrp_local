import { Router } from "express"
import { UserLiveBoost } from "@proto";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    
    const data = {
        userId: String(userid),
        liveBoost: 99,
        serverDate: Date.now(),
        liveBoostBonusType: "default"
    }

    const message = UserLiveBoost.fromJSON(data);
    const buffer = Buffer.from(UserLiveBoost.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.removeHeader('Content-Length');
    res.removeHeader('Transfer-Encoding');
    res.setHeader('content-type', 'application/octet-stream');

    res.writeHead(200);
    res.write(encBuffer);
    res.end();
})

export default router;