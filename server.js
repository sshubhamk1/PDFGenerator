// api.js
const express = require("express");
const { Queue } = require("bullmq");
const { Pool } = require("pg");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const Redis = require("ioredis");
const { WebSocketServer } = require("ws");

const app = express();
app.use(express.json({limit: "500mb"}));
app.use(cors());
app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
});
const queue = new Queue("pdf-jobs", { connection: redis });

const pg = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});

/* ---------------- WS ---------------- */
const wss = new WebSocketServer({ port: 8080 });
const clients = new Map();

wss.on("connection", (ws, req) => {
    const url = new URL(req.url, "http://localhost/");
    const jobId = url.searchParams.get("jobId");

    if (jobId) clients.set(jobId, ws);

    ws.on("close", () => clients.delete(jobId));
});

/* -------- Redis Pub/Sub -------- */
const sub= new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
});

sub.subscribe("job-updates");

sub.on("message", (channel, message) => {
    const data = JSON.parse(message);
    const ws = clients.get(data.jobId);

    if (ws) ws.send(JSON.stringify(data));
});

/* ---------------- API ---------------- */
app.post("/job", async (req, res) => {
    console.log("running job")
    const jobId = uuidv4();

    await pg.query(
        "INSERT INTO jobs (id, status) VALUES ($1, $2)",
        [jobId, "queued"]
    );

    await queue.add("pdf", {
        jobId,
        payload: req.body
    }, {
    jobId: jobId,
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000
    },
    removeOnComplete: false, // keep for resume/debug
    removeOnFail: false,     // important for retry visibility
    timeout: 600000 //
    });

    res.json({ jobId });
});

/* -------- Download -------- */
app.get("/download/:jobId", async (req, res) => {
    const { rows } = await pg.query(
        "SELECT file_name, file_data FROM job_files WHERE job_id=$1",
        [req.params.jobId]
    );

    if (!rows.length) return res.status(404).send("Not ready");

    if (rows.length === 1) {
        res.setHeader("Content-Type", "application/pdf");
        return res.end(rows[0].file_data);
    }

    const archiver = require("archiver");
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip");
    archive.pipe(res);

    rows.forEach(f => {
        archive.append(f.file_data, { name: f.file_name });
    });

    archive.finalize();
});

app.listen(process.env.APP_PORT, () => console.log(`API running on port ${process.env.APP_PORT}`));