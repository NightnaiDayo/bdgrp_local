import { Router } from "express";
import { SuiteUserGetResponse } from "@proto";
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true })

router.post('/', (req, res) => {

    const data = {
        userGraphicalInformationList: {},
    }

    const message = SuiteUserGetResponse.fromJSON(data);
    const buffer = Buffer.from(SuiteUserGetResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.removeHeader('Content-Length');
    res.removeHeader('Transfer-Encoding');
    res.setHeader('content-type', 'application/octet-stream');

    res.writeHead(200);
    res.write(encBuffer);
    res.end();
})

export default router;