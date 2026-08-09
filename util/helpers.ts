/**
 * Shared helper functions used across multiple route handlers.
 * Centralised here to avoid duplication.
 */

export function computeMusicClearInfo(userMusicScore: any): Record<string, any> {
    const difficulties = ["easy", "normal", "hard", "expert", "special"];
    const stats: Record<string, { cleared: number; fullCombo: number; allPerfect: number }> =
        Object.fromEntries(difficulties.map(d => [d, { cleared: 0, fullCombo: 0, allPerfect: 0 }]));

    for (const { entries } of Object.values(userMusicScore) as any[]) {
        if (!entries) continue;
        for (const { musicDifficulty: diff, clearStatus } of entries) {
            if (!stats[diff]) continue;
            stats[diff].cleared++;
            if (clearStatus === "full_combo") stats[diff].fullCombo++;
            if (clearStatus === "all_perfect") stats[diff].allPerfect++;
        }
    }

    return {
        entries: Object.fromEntries(
            difficulties.map(d => [d, {
                clearedMusicCount: stats[d].cleared,
                fullComboMusicCount: stats[d].fullCombo,
                allPerfectMusicCount: stats[d].allPerfect
            }])
        )
    };
}

export function computeMusicClearCountInfo(userMusicScore: any): Record<string, any> {
    return {
        entries: Object.fromEntries(
            Object.entries(userMusicScore)
                .map(([id, data]: [string, any]) => [id, data?.entries?.length ?? 0])
                .filter(([, count]) => count > 0)
        )
    };
}

export function buildUserSituations(userid: any, master: any, user?: any) {
    return Object.values(master.masterCharacterSituationMap.entries)
        .filter((card: any) => card.releasedAt !== "4128645600000" && card.releasedAt !== "4131237600000")
        .map((card: any) => {
            const maxLevel = Math.max(...Object.keys(card.parameterMap || {}).map(Number));
            const hasTraining = card.rarity >= 3;
            return {
                userId: userid,
                situationId: Number(card.situationId),
                level: maxLevel,
                exp: 0,
                createdAt: card.releasedAt,
                addExp: 0,
                trainingStatus: hasTraining ? "done" : "not_doing",
                duplicateCount: 0,
                illust: user?.situationIllust?.[card.situationId] ?? (hasTraining ? "after_training" : "normal"),
                skillExp: 0,
                skillLevel: 5,
                userAppendParameter: hasTraining ? {
                    userId: userid,
                    situationId: Number(card.situationId),
                    performance: card.training?.trainingPerformance,
                    technique: card.training?.trainingTechnique,
                    visual: card.training?.trainingVisual,
                    characterPotentialPerformance: 30,
                    characterPotentialTechnique: 30,
                    characterPotentialVisual: 30,
                    characterBonusPerformance: 30,
                    characterBonusTechnique: 30,
                    characterBonusVisual: 30
                } : undefined,
                limitBreakRank: 4
            };
        });
}

export function buildUserProfileDegree(userid: any, user: any): Record<string, any> {
    const map: Record<string, any> = {
        first: { userId: Number(userid), profileDegreeType: "first", degreeId: user.degree[0] }
    };
    if (user.degree[1]) {
        map.second = { userId: Number(userid), profileDegreeType: "second", degreeId: user.degree[1] };
    }
    return map;
}

export function buildCharacterRankMap(charIds?: number[]) {
    const ids = charIds ?? Array.from({ length: 40 }, (_, i) => i + 1);
    return {
        entries: Object.fromEntries(
            ids.map(id => [String(id), {
                rank: 100, exp: 0, addExp: 0, nextExp: 0, totalExp: 0, releasedPotentialLevel: 50
            }])
        )
    };
}

export function getScoreRank(score: number, difficultyMaster: any): string {
    if (!difficultyMaster) return "c";
    if (score >= difficultyMaster.scoreSS) return "ss";
    if (score >= difficultyMaster.scoreS) return "s";
    if (score >= difficultyMaster.scoreA) return "a";
    if (score >= difficultyMaster.scoreB) return "b";
    if (score >= difficultyMaster.scoreC) return "c";
    return "c";
}