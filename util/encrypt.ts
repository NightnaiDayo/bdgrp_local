import crypto from "crypto";
import { Keys } from "../config.json";

export function encrypt(buf: Buffer): Buffer {
    const cipher = crypto.createCipheriv('aes-128-cbc', Keys.Key, Keys.IV);
    cipher.setAutoPadding(true);

    return Buffer.concat([cipher.update(buf), cipher.final()])
}