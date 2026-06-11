import { Router } from "express";
import { SuiteUserLoginBonusAcceptAllResponse } from "@proto";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', (req, res) => {

    const data = {
        updateResources: {}
    }

    const message = SuiteUserLoginBonusAcceptAllResponse.fromJSON(data);
    const buffer = Buffer.from(SuiteUserLoginBonusAcceptAllResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.removeHeader('Content-Length');
    res.removeHeader('Transfer-Encoding');
    res.setHeader('content-type', 'application/octet-stream');

    res.writeHead(200);
    res.write(encBuffer);
    res.end();
})

export default router;