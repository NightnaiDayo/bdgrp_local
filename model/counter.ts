import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    seq: { type: mongoose.Schema.Types.BigInt, default: 8000000n }
})

export const Counter = mongoose.model('Counter', Schema);