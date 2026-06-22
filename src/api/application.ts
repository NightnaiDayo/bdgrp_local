import { Router } from 'express';
import axios from "axios";
import fs from 'fs';
import path from "path";

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
        const resp = await axios.get(`${baseUrl}/api/application`, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': req.get("User-Agent") as string,
                'X-Unity-Version': req.get("X-Unity-Version") as string,
                'Content-Type': req.get("Content-Type") as string,
                'Accept': req.get("Accept") as string,
                'Accept-Encoding': req.get("Accept-Encoding") as string,
                'x-clientversion': req.get("x-clientversion") as string,
            }
        });

        buffer = resp.data;
        fs.writeFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "application.binpb")}`, Buffer.from(resp.data));
    } catch(e) {
        buffer = fs.readFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "application.binpb")}`);
    }

    res.send(buffer);
})

export default router;