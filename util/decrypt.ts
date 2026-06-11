import crypto from "crypto";
import { Keys } from '../config.json'

export function decrypt(buf: Buffer): Buffer {
    const decipher = crypto.createDecipheriv('aes-128-cbc', Keys.Key, Keys.IV);

    decipher.setAutoPadding(false);
    let decrypted = Buffer.concat([decipher.update(buf), decipher.final()]);
    const padLen = decrypted[decrypted.length - 1];
    if (padLen > 0 && padLen <= 16 && padLen <= decrypted.length) {
        decrypted = decrypted.subarray(0, decrypted.length - padLen);
    }

    return decrypted;
}