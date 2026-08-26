import { Router } from 'express';
import axios from "axios";
import fs from 'fs';
import path from "path";

const router = Router()

router.get('/', async (req, res) => {
    let buffer;

    try {
        const resp = await axios.get(`https://l3-prod-all-bd.bilibiligame.net/api/system/config`, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': req.get("User-Agent") as string,
                'X-Unity-Version': req.get("X-Unity-Version") as string,
                'Content-Type': req.get("Content-Type") as string,
                'Accept': req.get("Accept") as string,
                'Accept-Encoding': req.get("Accept-Encoding") as string,
                'x-clientversion': req.get("x-clientversion") as string,
                'x-platformid': req.get("x-platformid") as string,
                'x-deviceid': req.get("x-deviceid") as string,
                'x-channelid': req.get("x-channelid") as string,
            }
        });

        buffer = resp.data;
        fs.writeFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "config.binpb")}`, Buffer.from(resp.data));
    } catch(e) {
        console.log(e)
        buffer = fs.readFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "config.binpb")}`);
    }

    res.send(buffer);
})

export default router;