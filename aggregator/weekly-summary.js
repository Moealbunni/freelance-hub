// weekly-summary.js
// Reads applications.json and sends you a stats summary:
// how many matches, broken down by category and status.
// Designed to run once a week (see .github/workflows/weekly-summary.yml).

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");
const APPS_PATH = path.join(__dirname, "applications.json");

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

function loadApps() {
  if (!fs.existsSync(APPS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(APPS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

async function sendEmail(subject, htmlBody) {
  const cfg = config.notifications.email;
  const apiKey = process.env.RESEND_API_KEY;
  if (!cfg.enabled || !apiKey) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: cfg.fromAddress, to: cfg.toAddress, subject, html: htmlBody }),
    });
    console.log("Weekly email:", res.ok ? "sent" : await res.text());
  } catch (err) {
    console.error("Weekly email error:", err.message);
  }
}

async function sendWhatsApp(text) {
  const cfg = config.notifications.whatsapp;
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!cfg.enabled || !apiKey) return;
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cfg.phone}&text=${encodeURIComponent(
      text
    )}&apikey=${apiKey}`;
    const res = await fetch(url);
    console.log("Weekly WhatsApp:", res.ok ? "sent" : await res.text());
  } catch (err) {
    console.error("Weekly WhatsApp error:", err.message);
  }
}

function main() {
  const apps = loadApps();
  const entries = Object.entries(apps);

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = entries.filter(([, a]) => new Date(a.firstSeen).getTime() >= oneWeekAgo);

  const byCategory = {};
  const byStatus = {};
  for (const [, a] of thisWeek) {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  }

  const categoryLines = Object.entries(byCategory)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join("\n");
  const statusLines = Object.entries(byStatus)
    .map(([status, count]) => `${status}: ${count}`)
    .join("\n");

  const summary = `Weekly summary — ${thisWeek.length} new matches this week

By category:
${categoryLines || "none"}

By status:
${statusLines || "none"}

Total tracked all-time: ${entries.length}

Tip: mark a job's status with:
node mark-status.js <job-id> applied`;

  console.log(summary);

  sendEmail(
    `Weekly job alert summary — ${thisWeek.length} new this week`,
    `<pre style="font-family:inherit;white-space:pre-wrap;">${summary}</pre>`
  );
  sendWhatsApp(summary);
}

main();
