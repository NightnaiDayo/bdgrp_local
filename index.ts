import express from 'express';
import path from 'path';
import fs from 'fs';
import morgan from "morgan"
import chalk from "chalk";

const app = express();
const PORT = 8482;

if (!fs.existsSync('.env')) {
    console.error('Error: .env not found.')
    process.exit(1)
}

const servers = ["TW", "JP", "GL", "CN"]

if(!servers.find(s => process.env.SERVER == s)) {
    console.error('Error: Unknown Server.')
    process.exit(1)
}

fs.mkdirSync("resp/TW", { recursive: true });
fs.mkdirSync("resp/JP", { recursive: true });
fs.mkdirSync("resp/GL", { recursive: true });
fs.mkdirSync("resp/CN", { recursive: true });

app.set('strict routing', true); 
app.use(morgan('dev')); app.disable('x-powered-by'); 
app.set('etag', false);
app.use(express.raw({ type: "*/*" }))

app.use((req, res, next) => {
    req.url = req.url.replace(/\/+/g, '/');
    next();
});

let db: any = fs.existsSync('./db.json')
    ? JSON.parse(fs.readFileSync('./db.json', 'utf-8'))
    : {};

if (!db.Users) db.Users = {};

for (const server of servers) {
    if (!db.Users[server]) db.Users[server] = [];
}

fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));

const root = path.join(__dirname, "src")

function normalizeSegment(segment: string) {
    const match = segment.match(/^\[(.+)]$/)
    return match ? `:${match[1]}` : segment
}

const serverOnlyRoutes: Record<string, string> = {
    '/api/user/login': 'CN',
    '/api/acdm/:userid': 'CN',
    '/api/user/heart/:userid': 'CN',
    '/api/system/config': 'CN',
    '/api/missionreward.map': 'CN'
}

function loadRoutes(dir: string, basePath: string) {
    if (!fs.existsSync(dir)) return

    const entries = fs.readdirSync(dir)

    for (const entry of entries) {
        const fullPath = path.join(dir, entry)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            loadRoutes(
                fullPath,
                `${basePath}/${normalizeSegment(entry)}`
            )
            continue
        }

        if (!entry.endsWith(".js") && !entry.endsWith(".ts")) {
            continue
        }

        const name = entry.replace(/\.(ts|js)$/, "")


        const routePath = name === "index"
            ? `${basePath.replace(/\/$/, "")}/`
            : `${basePath}/${normalizeSegment(name)}`

        const requiredServer = serverOnlyRoutes[routePath]
        if (requiredServer && requiredServer !== process.env.SERVER) {
            continue
        }

        app.use(routePath, require(fullPath).default)
        console.log("Loaded:", routePath)
    }
}

loadRoutes(path.join(root, "api"), "/api")

app.get('/', (req, res) => {
    res.send(process.env.SERVER)
})

app.listen(PORT, () => {
    console.log(`Running on ${PORT}`)
    console.log(`Server: ${chalk.hex('00AABB')(process.env.SERVER)}`)
})
