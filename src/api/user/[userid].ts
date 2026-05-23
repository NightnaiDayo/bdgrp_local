import { Router } from "express";
import { UserPutRequest } from "@proto";
import { decrypt } from "@util/decrypt";
import { db, saveDb } from "@db";

const router = Router({ mergeParams: true })
router.put('/', async (req, res) => {
    const encReq = req.body;
    const buffer = decrypt(encReq);
    const decoded = UserPutRequest.decode(buffer);

    const userId = Number(req.params.userid);
    const user = db.Users.find((u: any) => u.userId === userId);

    for (const key in decoded) {
        const value = decoded[key as keyof typeof decoded];
        switch (key) {
            case 'userName':
            case 'birthMonth':
            case 'introduction':
            case 'tutorialStatus':
                user[key] = value;
                if (key === 'tutorialStatus' && value === 'end') {
                    user.tutorialEndedAt = String(Date.now());
                }
                break;
            case 'mainDeck':
                user.mainDeck = Number(value);
                break;
            case 'degree':
                user.degree = value;
                break;
        }
    }

    saveDb();
    res.send('');
});
export default router;