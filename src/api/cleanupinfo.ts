import { Router } from 'express';
import axios from "axios";
import fs from 'fs';
import path from "path";

const router = Router()

router.get('/', async (req, res) => {
    let buffer;

    try {
        const resp = await axios.get('https://v940-bd.mobimon.com.tw/api/cleanupinfo', {
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
        fs.writeFileSync(`${path.join(process.cwd(), "resp", "cleanupinfo.binpb")}`, Buffer.from(buffer));
    } catch(e) {
        buffer = fs.readFileSync(`${path.join(process.cwd(), "resp", "cleanupinfo.binpb")}`)
    }

    res.send(buffer)
})

export default router;