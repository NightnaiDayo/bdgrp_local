import { Router } from "express"
import axios from "axios";

const router = Router()

router.options('/', async(req, res) => {
    let baseUrl;

    switch(process.env.SERVER) {
        case 'TW':
            baseUrl = 'https://v940-bd.mobimon.com.tw';
            break;
        case 'JP':
            baseUrl = 'https://api.garupa.jp'
            break;
    }

    const resp = await axios.options(`${baseUrl}/information`)
    res.send(resp.data)
})

export default router;