import { Router } from "express";
import axios from "axios";
import https from 'https';

const router = Router({ mergeParams: true })

router.post('/', async (req, res) => {
    const skipReqHeaders = new Set([
        'transfer-encoding',
        'connection',
        'keep-alive',
        'content-encoding',
        'content-length',
        'cf-connecting-ip',
        'cf-ray',
        'cf-visitor',
        'cf-ipcountry',
        'cf-pseudo-ipv4',
        'x-forwarded-for',
        'x-forwarded-proto',
        'x-real-ip',
        'cdn-loop',
    ]);

    const cleanHeaders = {
        ...Object.fromEntries(
            Object.entries(req.headers).filter(([k]) => !skipReqHeaders.has(k.toLowerCase()))
        ),
        host: 'l3-prod-all-bd.bilibiligame.net',
    };

    try {
        const resp = await axios.post(`https://l3-prod-all-bd.bilibiligame.net/api/tcpServer/${req.params.userid}`,
            req.body,
            {
                responseType: 'arraybuffer',
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                headers: cleanHeaders
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