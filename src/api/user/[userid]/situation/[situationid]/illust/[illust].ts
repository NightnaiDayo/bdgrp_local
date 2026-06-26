import { Router } from "express";
import { UserSituation } from "@proto";
import { saveDb, db } from "@db";
import { getMaster } from "@master";
import {encrypt} from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', (req, res) => {
    const userid = req.params.userid

    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);

    const master = getMaster();
    const illust = req.params.illust
    const situation = req.params.situationid

    user.situationIllust[situation] = illust

    saveDb();

    const sit = Object.values(master.masterCharacterSituationMap.entries)
        .find((s: any) => s.situationId == situation)
    const maxLevel = Math.max(...Object.keys(sit.parameterMap || {}).map(Number));
    const hasTraining = sit.rarity >= 3;
    const data = {
        userId: userid,
        situationId: Number(situation),
        level: maxLevel,
        exp: 0,
        createdAt: sit.releasedAt,
        addExp: 0,
        trainingStatus: hasTraining ? "done" : "not_doing",
        duplicateCount: 0,
        illust: user.situationIllust[situation],
        skillExp: 0,
        skillLevel: 5,
        userAppendParameter: hasTraining ? {
            userId: userid,
            situationId: Number(situation),
            performance: sit.training?.trainingPerformance,
            technique: sit.training?.trainingTechnique,
            visual: sit.training?.trainingVisual,
            characterPotentialPerformance: 30,
            characterPotentialTechnique: 30,
            characterPotentialVisual: 30,
            characterBonusPerformance: 30,
            characterBonusTechnique: 30,
            characterBonusVisual: 30
        } : undefined,
        limitBreakRank: 0
    };

    res.send(encrypt(UserSituation.encode(UserSituation.fromJSON(data)).finish()));
})

export default router;