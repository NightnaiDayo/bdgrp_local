import { Router } from "express";
import { UserPutRequest } from "@proto";
import { decrypt } from "@util/decrypt";
import { db, saveDb } from "@db";

const router = Router({ mergeParams: true })
router.put('/', async (req, res) => {
    const encReq = req.body;
    const buffer = decrypt(encReq);
    const decoded = UserPutRequest.decode(buffer);

    //@ts-ignore
    const userId = Number(req.params.userid);
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId === userId);

    for (const key in decoded) {
        const value = decoded[key as keyof typeof decoded];
        switch (key) {
            case 'userName':
            case 'birthMonth':
            case 'introduction':
            case 'tutorialStatus':
                if (value !== "" && value !== undefined) {
                    user[key] = value;
                }
                break;
            case 'mainDeck':
                if (Number(value) !== 0) {
                    user.mainDeck = Number(value);
                }
                break;
            case 'degree':
                if (value !== 0) {
                    user.degree = value;
                }
                break;
        }
    }

    saveDb();
    res.send('');
});

router.get('/', async(req, res) => {

})

export default router;