import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.BigInt, required: true, unique: true },
    situationId: { type: Number, required: true },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    createdAt: { type: mongoose.Schema.Types.BigInt, default: Date.now() },
    addExp: { type: Number, default: 0 },
    trainingStatus: { type: String, default: "not_doing" },
    duplicateCount: { type: Number, default: 0 },
    illust: { type: String, default: "normal" },
    skillExp: { type: Number, default: 0 },
    skillLevel: { type: Number, default: 1 },
    limitBreakRank: { type: Number, default: 0 },
});

export const UserRegistrationModel = mongoose.model('UserSituation', Schema);