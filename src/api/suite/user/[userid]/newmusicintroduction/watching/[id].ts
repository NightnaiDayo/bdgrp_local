import { Router } from "express";
import {SuiteMasterGetResponse, SuiteUserGetResponse} from "@proto";
import { encrypt } from "@util/encrypt";
import { getMaster } from "@master";


const router = Router({ mergeParams: true })

router.post('/', (req, res) => {
    // @ts-ignore
    const userid = req.params.userid

    const master = getMaster();

    const data = {
        userNewMusicIntroductionMap: {
            entries: Object.fromEntries(
                // @ts-ignore
                Object.values(master.masterNewMusicIntroductionMap.entries).map((item: any) => [
                    Number(item.newMusicIntroductionId),
                    {
                        userId: userid,
                        newMusicIntroductionId: item.newMusicIntroductionId,
                        status: "already_read"
                    }
                ])
            )
        },
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