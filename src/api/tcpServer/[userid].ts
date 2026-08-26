import { Router } from "express";
import axios from "axios";
import { db } from "@db";

const router = Router({ mergeParams: true })

router.post('/', async (req, res) => {
    const user = db.Users[process.env.SERVER].find((u: any) => String(u.userId) == String(req.params.userid));

    try {
        const resp = await axios.post(`https://l3-prod-all-bd.bilibiligame.net/api/tcpServer/${req.params.userid}`,
            req.body,
            {
                responseType: 'arraybuffer',
                headers: req.headers
            }
        )

        const skipHeaders = new Set([
            'transfer-encoding',
            'connection',
            'keep-alive',
            'content-encoding',
            'content-length',
        ]);

        Object.entries(resp.headers).forEach(([key, value]) => {
            if (!skipHeaders.has(key.toLowerCase())) {
                res.setHeader(key, value as string);
            }
        });

        res.removeHeader('Content-Length');
        res.write(resp.data);
        res.end();
    } catch(e) {
        console.log(e)
    }
});

export default router;