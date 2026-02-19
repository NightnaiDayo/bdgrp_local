import crypto from "crypto";
import { Keys } from '../config.json'
import fs from "fs";

export function decrypt(buf: Buffer): Buffer {
    const decipher = crypto.createDecipheriv('aes-128-cbc', Keys.Key, Keys.IV);

    decipher.setAutoPadding(true);
    let decrypted = decipher.update(buf);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
}
