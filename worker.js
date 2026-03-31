// worker.js
const { Worker } = require("bullmq");
const Redis = require("ioredis");
const puppeteer = require("puppeteer");
const { Pool } = require("pg");

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null,
});
const pg = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});

/* -------- Browser Pool -------- */
let browser;

async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    }
    return browser;
}

/* -------- Helpers -------- */
function jsonToHTML(json) {
    let rows = "";
    for (const k in json) {
        rows += `<tr><td>${k}</td><td>${JSON.stringify(json[k])}</td></tr>`;
    }
    return `<table border="1">${rows}</table>`;
}

async function generatePDF(html) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html);
    const buffer = await page.pdf();
    await page.close();
    return buffer;
}

/* -------- Worker -------- */
const worker = new Worker(
    "pdf-jobs",
    async job => {
        const { jobId, payload } = job.data;
        const data = Array.isArray(payload) ? payload : [payload];

        await pg.query("UPDATE jobs SET status='processing', updated_at=NOW() WHERE id=$1", [jobId]);
        for (let i = 0; i < data.length; i++) {
            const html = jsonToHTML(data[i]);
            const buffer = await generatePDF(html);

            await pg.query(
                "INSERT INTO job_files (job_id, file_name, file_data) VALUES ($1,$2,$3)",
                [jobId, `file_${i}.pdf`, buffer]
            );

            const progress = Math.round(((i + 1) / data.length) * 100);

            await pg.query(
                "UPDATE jobs SET progress=$1, updated_at=NOW() WHERE id=$2",
                [progress, jobId]
            );

            await redis.publish(
                "job-updates",
                JSON.stringify({ jobId, status: "processing", progress })
            );
        }

        await pg.query(
            "UPDATE jobs SET status='completed', progress=100,updated_at=NOW() WHERE id=$1",
            [jobId]
        );

        await redis.publish(
            "job-updates",
            JSON.stringify({
                jobId,
                status: "completed",
                downloadUrl: `/download/${jobId}`
            })
        );
    },
    { connection: redis }
);