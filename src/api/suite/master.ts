import { Router } from 'express';
import axios from "axios";
import fs from 'fs';
import path from "path";
import { reloadMaster } from "@master"

const router = Router()

router.get('/', async (req, res) => {
    let buffer;
    let baseUrl;

    switch(process.env.SERVER) {
        case 'TW':
            baseUrl = 'https://v940-bd.mobimon.com.tw';
            break;
        case 'JP':
            baseUrl = 'https://api.garupa.jp'
            break;
    }

    try {
        const resp = await axios.get(`${baseUrl}/api/suite/master`, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': req.get("User-Agent") as string,
                'Content-Type': req.get("Content-Type") as string,
                'Accept': req.get("Accept") as string,
                'Accept-Encoding': req.get("Accept-Encoding") as string,
                'x-clientversion': req.get("x-clientversion") as string,
            }
        });

        buffer = resp.data;
        fs.writeFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "suitemaster.bz2")}`, Buffer.from(buffer));
    } catch(e) {
        buffer = fs.readFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "suitemaster.bz2")}`)
    }

    res.set({
        'content-length': Buffer.byteLength(buffer),
        'content-type': 'application/octet-stream',
        'x-encoding': 'bzip2'
    });

    res.send(buffer)

    reloadMaster();
})

export default router;