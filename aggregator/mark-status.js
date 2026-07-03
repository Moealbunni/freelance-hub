// mark-status.js
// Updates the status of a job you applied to, so the weekly summary
// can tell you what's pending vs. replied vs. dead.
//
// Usage:
//   node mark-status.js <job-id> <status>
//
// Example:
//   node mark-status.js reddit-1abcde applied
//   node mark-status.js jobicy-98765 replied
//
// Valid statuses: applied, replied, ignored, booked
//
// Find the job-id in the "(ref: ...)" line at the bottom of each
// drafted pitch in your email/WhatsApp digest.

const fs = require("fs");
const path = require("path");

const APPS_PATH = path.join(__dirname, "applications.json");
const VALID_STATUSES = ["new", "applied", "replied", "ignored", "booked"];

const [, , jobId, status] = process.argv;

if (!jobId || !status) {
  console.log("Usage: node mark-status.js <job-id> <status>");
  console.log(`Valid statuses: ${VALID_STATUSES.join(", ")}`);
  process.exit(1);
}

if (!VALID_STATUSES.includes(status)) {
  console.log(`"${status}" isn't a recognized status. Use one of: ${VALID_STATUSES.join(", ")}`);
  process.exit(1);
}

if (!fs.existsSync(APPS_PATH)) {
  console.log("No applications.json found yet — run fetch-jobs.js at least once first.");
  process.exit(1);
}

const apps = JSON.parse(fs.readFileSync(APPS_PATH, "utf-8"));

if (!apps[jobId]) {
  console.log(`No record found for job-id "${jobId}". Double check it against your digest message.`);
  process.exit(1);
}

apps[jobId].status = status;
apps[jobId].updatedAt = new Date().toISOString();
fs.writeFileSync(APPS_PATH, JSON.stringify(apps, null, 2));

console.log(`Updated "${apps[jobId].title}" (${jobId}) → ${status}`);
