import { Router } from "express";
import {UserGachaRequest, SuiteUserGachaResponse, SuiteMasterGetResponse} from "@proto";
import {decrypt} from "@util/decrypt";
import { getMaster } from "@master";
import { encrypt } from "@util/encrypt"

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    const decoded = UserGachaRequest.decode(decrypt(req.body));
    const master = getMaster();
    const gacha = master.masterGachaMap.entries[req.params.gachaid];

    const list = gacha.details
        .filter(d => d.rarityIndex === 5)
        .map(d => d.situationId);
    const paymentMethod = gacha.paymentMethods
        .find(p => p.paymentMethodId === decoded.paymentMethodId);

    function spin(count) {
        return Array.from({ length: count }, () => ({
            situationId: list[Math.floor(Math.random() * list.length)],
            isFirstGet: true
        }));
    }

    const data = {
        gachaResults: {
            entries: spin(paymentMethod.count),
            extras: {},
            beforeGachaSeal: 14,
            afterGachaSeal: 15,
            gachaGuaranteedRarity: "none"
        },
        updateResources: {}
    }

    res.send(encrypt(Buffer.from(SuiteUserGachaResponse.encode(SuiteUserGachaResponse.fromJSON(data)).finish())))
})

export default router;