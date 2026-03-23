import mongoose from "mongoose";

const musicSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.BigInt, required: true },
    musicId: { type: Number, required: true },
    seq: { type: Number, default: 1 },
    hasMv: { type: Boolean, required: true },
    isFavorite: { type: Boolean, default: false },
    favoriteMap: {},
    createdAt: { type: mongoose.Schema.Types.BigInt, required: true }
})

const Schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.BigInt, required: true, unique: true },
    musics: [musicSchema]
})

export const UserMusicInventoryModel = mongoose.model("UserMusicInventory", Schema)