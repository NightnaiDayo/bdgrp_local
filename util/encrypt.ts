import crypto from "crypto";
import { Keys } from "../config.json";

export function encrypt(buf: Buffer): Buffer {
    const cipher = crypto.createCipheriv('aes-128-cbc', Keys.Key[process.env.SERVER], Keys.IV[process.env.SERVER]);
    cipher.setAutoPadding(true);

    return Buffer.concat([cipher.update(buf), cipher.final()])
}