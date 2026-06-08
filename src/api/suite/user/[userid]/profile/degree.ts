import { Router } from "express";
import {decrypt} from "@util/decrypt";
import { UserDecoDegreeRequest, SuiteUserDecoDegreeResponse } from "@proto";
import { saveDb, db } from "@db";
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = UserDecoDegreeRequest.decode(reqbuffer);

    // @ts-ignore
    const userid = req.params.userid;

    const user = db.Users.find((u: any) => u.userId == userid);
    const entries = {}


    user.degree[0] = decoded.degreeIdFirst
    // @ts-ignore
    entries["first"] = {
        userId: userid,
        profileDegreeType: "first",
        degreeId: user.degree[0]
    }

    if (decoded.degreeIdSecond) {
        user.degree[1] = decoded.degreeIdSecond
        // @ts-ignore
        entries["second"] = {
            userId: userid,
            profileDegreeType: "second",
            degreeId: user.degree[1]
        }
    } else {
        user.degree[1] = null
    }

    saveDb();


    const data = {
        updateResources: {
            userProfileDegreeMap: {
                entries: entries
            }
        }
    }

    const message = SuiteUserDecoDegreeResponse.fromJSON(data);
    const buffer = Buffer.from(SuiteUserDecoDegreeResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.send(encBuffer)
})

export default router;