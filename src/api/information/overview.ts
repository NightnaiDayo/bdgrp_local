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
            baseUrl = 'https://v1010-bd.mobimon.com.tw';
            break;
        case 'JP':
            baseUrl = 'https://api.garupa.jp'
            break;
        case 'GL':
            baseUrl = 'https://api.app-bang-dream-gbp.com'
            break;
        case 'CN':
            baseUrl = 'https://l3-prod-all-bd.bilibiligame.net'
            break;
    }

    let headers = {
        'User-Agent': req.get("User-Agent") as string,
        'Content-Type': req.get("Content-Type") as string,
        'Accept': req.get("Accept") as string,
        'Accept-Encoding': req.get("Accept-Encoding") as string,
        'x-clientversion': req.get("x-clientversion") as string,
    }

    if(process.env.SERVER == "CN") {
        headers = {
            ...headers,
            'x-platformid': req.get("x-platformid") as string,
            'x-deviceid': req.get("x-deviceid") as string,
            'x-channelid': req.get("x-channelid") as string,
        }
    }

    try {
        const resp = await axios.get(`${baseUrl}/api/information/overview`, {
            responseType: 'arraybuffer',
            headers
        });

        buffer = resp.data;
        fs.writeFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "overview.binpb")}`, Buffer.from(resp.data));
    } catch(e) {
        buffer = fs.readFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "overview.binpb")}`);
    }

    res.send(buffer);
})

export default router;