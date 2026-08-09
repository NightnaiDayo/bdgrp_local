import fs from 'fs';
import path from 'path';

const dbPath = path.join(__dirname, 'db.json');

export const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

export const saveDb = () => {
    const tmp = dbPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, dbPath);
};