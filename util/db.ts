import sqlite3 from "sqlite3";
import { open } from 'sqlite';
import path from "path";

const db_path = path.join(process.cwd(), "db", "db.db")

export async function openDb() {
    return open({
        filename: db_path,
        driver: sqlite3.Database
    })
}