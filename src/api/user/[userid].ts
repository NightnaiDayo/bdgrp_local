import { Router } from "express";
import { UserPutRequest } from "../../../proto/generated/allmsgs";
import { UserGamedataModel } from "../../../model/userGamedata";
import { UserRegistrationModel } from "../../../model/userRegistration";
import { decrypt } from "../../../util/decrypt";

const router = Router({ mergeParams: true })

router.put('/', async (req, res) => {
    const encReq = req.body;
    const buffer = decrypt(encReq);
    const decoded = UserPutRequest.decode(buffer);

    const registrationUpdates: Record<string, any> = {};
    const gamedataUpdates: Record<string, any> = {};

    for(const key in decoded) {
        const value = decoded[key as keyof typeof decoded];

        switch(key) {
            case 'userName':
            case 'birthMonth':
            case 'introduction':
                registrationUpdates[key] = value;
                break;

            case 'tutorialStatus':
                registrationUpdates[key] = value;
                if(value == 'end') {
                    registrationUpdates['tutorialEndedAt'] = BigInt(Date.now());
                }
                break;

            case 'mainDeck':
                gamedataUpdates.mainDeck = Number(value);
                break;
            case 'degree':
                gamedataUpdates.degree = value;
                break;
        }
    }

    const operations = [];
    // @ts-ignore
    const userId = BigInt(req.params.userid);

    if (Object.keys(registrationUpdates).length > 0) {
        operations.push(
            UserRegistrationModel.updateOne(
                { userId },
                { $set: registrationUpdates }
            )
        );
    }

    if (Object.keys(gamedataUpdates).length > 0) {
        operations.push(
            UserGamedataModel.updateOne(
                { userId },
                { $set: gamedataUpdates }
            )
        );
    }

    await Promise.all(operations);
    res.send('')
})

export default router;