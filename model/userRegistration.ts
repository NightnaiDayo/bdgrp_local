import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.BigInt, required: true, unique: true },
    hash: { type: String, required: true },
    userName: { type: String, default: '新人工作人員' },
    clientVersion: { type: String },
    platform: { type: String },
    deviceModel: { type: String },
    operatingSystem: { type: String },
    birthMonth: { type: String, default: '199001' },
    tutorialStatus: { type: String, default: 'start' },
    introduction: { type: String, default: '你好！' },
    unknownString: { type: String, default: 'standard' },
    tutorialEndedAt: { type: mongoose.Schema.Types.BigInt, default: 0n },
});

export const UserRegistrationModel = mongoose.model('UserRegistration', Schema);