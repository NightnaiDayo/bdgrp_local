import { Router } from "express";
import { UserAuthRequest } from "@proto";
import {decrypt} from "@util/decrypt";

const router = Router({ mergeParams: true })

router.put('/', (req, res) => {
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserAuthRequest.decode(reqbuffer)
    // console.log(decoded)
    res.send('')
})

export default router;