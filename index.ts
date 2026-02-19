import express from 'express';
import path from 'path';
import fs from 'fs';
import morgan from "morgan";
import mongoose from 'mongoose';

const app = express();
const PORT = 8482;

app.set('strict routing', true);
app.use(morgan('dev'));

app.use(express.raw({ type: "*/*" }))

const root = path.join(__dirname, "src/api")

function normalizeSegment(segment: string) {
    const match = segment.match(/^\[(.+)]$/)
    return match ? `:${match[1]}` : segment
}

function loadRoutes(dir: string, basePath = "/api") {
    const entries = fs.readdirSync(dir)

    for (const entry of entries) {
        const fullPath = path.join(dir, entry)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            loadRoutes(fullPath, `${basePath}/${normalizeSegment(entry)}`)
        } else if (entry.endsWith(".js") || entry.endsWith(".ts")) {
            const name = entry.replace(/\.(ts|js)$/, "")
            let routePath;

            if (name === "index") {
                // 有結尾斜線的版本：路徑結尾加上 /
                routePath = basePath.endsWith('/') ? basePath : basePath + '/'
                const router = require(fullPath).default
                app.use(routePath, router)
            } else {
                // 一般檔案：維持原邏輯
                routePath = `${basePath}/${normalizeSegment(name)}`
                const router = require(fullPath).default
                app.use(routePath, router)
            }

            console.log("Loaded: ", routePath)
        }
    }
}

loadRoutes(root);

mongoose.connect('mongodb://localhost:27017/bandori_ps')
.then(() => {
    console.log('Connected to the database.')
}).catch((err) => {
    console.log(err)
})

app.listen(PORT, () => {
    console.log(`Running on ${PORT}`)
})