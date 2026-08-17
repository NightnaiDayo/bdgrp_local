import { Router } from "express";
import { EditUserDeckRequest, EditUserDeckResponse } from "@proto";
import { decrypt } from "@util/decrypt";
import { db, saveDb } from "@db";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    // @ts-ignore
    const userid = req.params.userid
    // @ts-ignore
    const deckid = req.params.deckid
    const encReq = req.body;
    const reqbuffer = decrypt(encReq);
    const decoded = EditUserDeckRequest.decode(reqbuffer)

    const user = db.Users[process.env.SERVER].find((u: any) => String(u.userId) === userid)
    let deck = user.decks.find((d: any) => Number(d.deckId) === deckid);
    let isNew = false;

    if(!deck) {
        deck = {
            deckId: Number(deckid),
            deckName: `樂團${deckid}`
        }
        isNew = true;
    }

    if(decoded.leader) deck.leader = decoded.leader
    if(decoded.member1) deck.member1 = decoded.member1
    if(decoded.member2) deck.member2 = decoded.member2
    if(decoded.member3) deck.member3 = decoded.member3
    if(decoded.member4) deck.member4 = decoded.member4
    deck.deckName = decoded.deckName
    deck.deckType = decoded.deckType


    if(isNew) user.decks.push(deck)

    saveDb();

    const data = {
        updateResources: {
            userDeckList: {
                entries: user.decks
            }
        }
    }

    const message = EditUserDeckResponse.fromJSON(data);
    const buffer = Buffer.from(EditUserDeckResponse.encode(message).finish())
    const encBuffer = encrypt(buffer)

    res.send(encBuffer)
})

export default router;