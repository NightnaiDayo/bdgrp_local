import mongoose from "mongoose";

const userAppendParameterSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.BigInt, required: true },
    situationId: { type: Number, required: true },
    performance: { type: Number, default: 400 },
    technique: { type: Number, default: 400 },
    visual: { type: Number, default: 400 },
    characterPotentialPerformance: { type: Number, default: 0 },
    characterPotentialTechnique: { type: Number, default: 0 },
    characterPotentialVisual: { type: Number, default: 0 },
    characterBonusPerformance: { type: Number, default: 0 },
    characterBonusTechnique: { type: Number, default: 0 },
    characterBonusVisual: { type: Number, default: 0 }
}, { _id: false });

const userSituationSchema = new mongoose.Schema({
    situationId: { type: Number, required: true },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    createdAt: { type: mongoose.Schema.Types.BigInt, default: Date.now },
    addExp: { type: Number, default: 0 },
    trainingStatus: { type: String, default: "not_doing" },
    duplicateCount: { type: Number, default: 0 },
    illust: { type: String, default: "normal" },
    skillExp: { type: Number, default: 0 },
    skillLevel: { type: Number, default: 1 },
    userAppendParameter: { type: userAppendParameterSchema, default: null },
    limitBreakRank: { type: Number, default: 0 },
});

const Schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.BigInt, required: true, unique: true },
    situations: [userSituationSchema]
})

export const UserSituationModel = mongoose.model('UserSituation', Schema);