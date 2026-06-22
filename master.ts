import { SuiteMasterGetResponse } from "@proto";
import fs from "fs";
import path from "path";
// @ts-ignore
import bzip2 from 'seek-bzip';
import { decrypt } from "@util/decrypt";

let cache: any = null;

export function getMaster() {
    return cache ?? reloadMaster();
}

export function reloadMaster() {
    try {
        const filePath = path.join(process.cwd(), "resp", process.env.SERVER, "suitemaster.bz2");

        const fileBuffer = fs.readFileSync(filePath);
        const decrypted = decrypt(fileBuffer);
        const decompressed = bzip2.decode(decrypted);

        cache = SuiteMasterGetResponse.toJSON(SuiteMasterGetResponse.decode(decompressed));
        return cache;
    } catch(e) {
        return cache;
    }
}