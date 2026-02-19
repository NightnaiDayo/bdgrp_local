import mongoose from "mongoose";

const penalty = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.BigInt, required: true, unique: true },
    badCount: { type: Number, default: 0 },
    billingPenaltyDate: { type: mongoose.Schema.Types.BigInt, default: 0n },
    penaltyDate: { type: mongoose.Schema.Types.BigInt, default: 0n },
    badDate: { type: mongoose.Schema.Types.BigInt, default: 0n }
}, { _id: false });

const recallResult = new mongoose.Schema({
    beforePaidStar: { type: Number, default: 0 },
    afterPaidStar: { type: Number, default: 0 },
    isCannotRecalledAllPaidStar: { type: Boolean, default: false }
}, { _id: false });

const Schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.BigInt, required: true, unique: true },
    rank: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    coin: { type: mongoose.Schema.Types.BigInt, default: 114514 },
    mainDeck: { type: Number, default: 1 },
    paidStar: { type: Number, default: 0 },
    freeStar: { type: Number, default: 0 },
    seal: { type: Number, default: 0 },
    degree: { type: Number, default: 100 },
    publishTotalDeckPowerFlg: { type: Boolean, default: false },
    publishBandRankFlg: { type: Boolean, default: false },
    publishMusicClearedFlg: { type: Boolean, default: false },
    publishMusicFullComboFlg: { type: Boolean, default: false },
    publishHighScoreRatingFlg: { type: Boolean, default: false },
    pooledExp: { type: mongoose.Schema.Types.BigInt, default: 0 },
    totalExp: { type: mongoose.Schema.Types.BigInt, default: 0 },
    nextExp: { type: Number, default: 0 },
    publishUpdatedAtFlg: { type: Boolean, default: true },
    startDashLoginBonusReceiveFlg: { type: Boolean, default: false },
    publishMusicAllPerfectFlg: { type: Boolean, default: false },
    publishDeckRankFlg: { type: Boolean, default: false },
    publishStageAchievementConditionsFlg: { type: Boolean, default: false },
    publishStageFriendRankingFlg: { type: Boolean, default: true },
    publishCharacterRankFlg: { type: Boolean, default: false },
    loginDays: { type: Number, default: 0 }
})

export const UserGamedataModel = mongoose.model('UserGamedata', Schema);