// fetch-jobs.js
// Pulls listings from public job APIs, filters for your keywords,
// dedupes against jobs already seen, and sends you a digest by
// email + WhatsApp. Designed to run on a schedule (see the GitHub
// Actions workflow in .github/workflows/job-alert.yml).

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");
const SEEN_PATH = path.join(__dirname, "seen-jobs.json");

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

function loadSeen() {
  if (!fs.existsSync(SEEN_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(SEEN_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveSeen(seen) {
  fs.writeFileSync(SEEN_PATH, JSON.stringify(seen, null, 2));
}

const APPS_PATH = path.join(__dirname, "applications.json");
function loadApps() {
  if (!fs.existsSync(APPS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(APPS_PATH, "utf-8"));
  } catch {
    return {};
  }
}
function saveApps(apps) {
  fs.writeFileSync(APPS_PATH, JSON.stringify(apps, null, 2));
}

function matchesKeywords(text) {
  const lower = text.toLowerCase();
  const hasExclude = config.excludeKeywords.some((k) => lower.includes(k.toLowerCase()));
  if (hasExclude) return false;
  return config.keywords.some((k) => lower.includes(k.toLowerCase()));
}

// --- Source: RemoteOK (public JSON API, no key required) ---
async function fetchRemoteOK() {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "job-aggregator-script" },
    });
    const data = await res.json();
    return data
      .filter((j) => j.id && j.position)
      .map((j) => ({
        id: `remoteok-${j.id}`,
        title: j.position,
        company: j.company || "Unknown",
        url: j.url || `https://remoteok.com/remote-jobs/${j.id}`,
        text: `${j.position} ${j.company} ${(j.tags || []).join(" ")} ${j.location || ""}`,
        source: "RemoteOK",
      }));
  } catch (err) {
    console.error("RemoteOK fetch failed:", err.message);
    return [];
  }
}

// --- Source: Arbeitnow (public JSON API, no key required) ---
async function fetchArbeitnow() {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    const data = await res.json();
    return (data.data || []).map((j) => ({
      id: `arbeitnow-${j.slug}`,
      title: j.title,
      company: j.company_name || "Unknown",
      url: j.url,
      text: `${j.title} ${j.company_name} ${(j.tags || []).join(" ")} ${j.location || ""}`,
      source: "Arbeitnow",
    }));
  } catch (err) {
    console.error("Arbeitnow fetch failed:", err.message);
    return [];
  }
}

// --- Source: Jobicy (public JSON API, worldwide remote listings, no key required) ---
async function fetchJobicy() {
  try {
    const res = await fetch("https://jobicy.com/api/v2/remote-jobs?count=100");
    const data = await res.json();
    return (data.jobs || []).map((j) => ({
      id: `jobicy-${j.id}`,
      title: j.jobTitle,
      company: j.companyName || "Unknown",
      url: j.url,
      text: `${j.jobTitle} ${j.companyName} ${j.jobIndustry || ""} ${j.jobType || ""} ${j.jobGeo || ""}`,
      source: "Jobicy",
    }));
  } catch (err) {
    console.error("Jobicy fetch failed:", err.message);
    return [];
  }
}

// --- Source: WeWorkRemotely, Design category (public RSS feed, no key required) ---
async function fetchWeWorkRemotelyDesign() {
  try {
    const res = await fetch("https://weworkremotely.com/categories/remote-design-jobs.rss");
    const xml = await res.text();
    const items = xml.split("<item>").slice(1);
    return items.map((item) => {
      const title = (item.match(/<title>([\s\S]*?)<\/title>/) || [, "Untitled"])[1]
        .replace("<![CDATA[", "")
        .replace("]]>", "")
        .trim();
      const link = (item.match(/<link>([\s\S]*?)<\/link>/) || [, ""])[1].trim();
      // WWR titles are usually formatted "Company: Job Title"
      const [company, ...rest] = title.split(":");
      return {
        id: `wwr-${link}`,
        title: rest.join(":").trim() || title,
        company: rest.length ? company.trim() : "Unknown",
        url: link,
        text: title,
        source: "WeWorkRemotely",
      };
    });
  } catch (err) {
    console.error("WeWorkRemotely fetch failed:", err.message);
    return [];
  }
}

// --- Source: Reddit (public JSON feeds, no key required — reads public posts only) ---
async function fetchReddit(subreddits) {
  let all = [];
  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://old.reddit.com/r/${sub}/new.json?limit=25`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "application/json",
        },
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("json")) {
        console.error(`Reddit r/${sub}: got non-JSON response (likely blocked), skipping.`);
        continue;
      }
      const data = await res.json();
      const posts = (data.data && data.data.children) || [];
      all = all.concat(
        posts.map((p) => ({
          id: `reddit-${p.data.id}`,
          title: p.data.title,
          company: `r/${sub}`,
          url: `https://reddit.com${p.data.permalink}`,
          text: `${p.data.title} ${p.data.selftext || ""}`,
          source: "Reddit",
        }))
      );
    } catch (err) {
      console.error(`Reddit fetch failed for r/${sub}:`, err.message);
    }
  }
  return all;
}

function matchesMusic(text) {
  const lower = text.toLowerCase();
  const mk = config.music.requestPhrases;
  const genres = config.music.genres;
  const hasPhrase = mk.some((k) => lower.includes(k.toLowerCase()));
  const hasGenreAndIntent =
    genres.some((g) => lower.includes(g.toLowerCase())) &&
    (lower.includes("producer") || lower.includes("production") || lower.includes("ghost"));
  return hasPhrase || hasGenreAndIntent;
}

function matchesCreativeCommunity(text) {
  const lower = text.toLowerCase();
  const hasExclude = config.excludeKeywords.some((k) => lower.includes(k.toLowerCase()));
  if (hasExclude) return false;
  const rp = config.creativeCommunity.requestPhrases;
  const hasPhrase = rp.some((k) => lower.includes(k.toLowerCase()));
  const isHiringTag = lower.includes("[hiring]") || lower.includes("[ hiring ]");
  const hasSkillMatch = matchesKeywords(text);
  return hasPhrase || (isHiringTag && hasSkillMatch);
}

async function sendEmail(subject, htmlBody) {
  const cfg = config.notifications.email;
  if (!cfg.enabled) return;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("Skipping email: RESEND_API_KEY not set.");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: cfg.fromAddress,
        to: cfg.toAddress,
        subject,
        html: htmlBody,
      }),
    });
    if (!res.ok) console.error("Email send failed:", await res.text());
    else console.log("Email digest sent.");
  } catch (err) {
    console.error("Email send error:", err.message);
  }
}

async function sendWhatsApp(text) {
  const cfg = config.notifications.whatsapp;
  if (!cfg.enabled) return;
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!apiKey) {
    console.log("Skipping WhatsApp: CALLMEBOT_APIKEY not set.");
    return;
  }
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cfg.phone}&text=${encodeURIComponent(
      text
    )}&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) console.error("WhatsApp send failed:", await res.text());
    else console.log("WhatsApp digest sent.");
  } catch (err) {
    console.error("WhatsApp send error:", err.message);
  }
}

function buildPitch(job) {
  const p = config.profile;
  const intro =
    job.category === "music"
      ? p.musicPitch || p.pitch
      : p.pitch;
  const links =
    job.category === "music"
      ? `Music portfolio: ${p.musicPortfolioUrl || p.portfolioUrl}`
      : `Portfolio: ${p.portfolioUrl}`;
  return `Hi, my name is ${p.name}.

${intro}

I saw this post ("${job.title}") and wanted to reach out.

${links}
Instagram: ${p.instagramUrl}
Email: ${p.email}
WhatsApp: https://wa.me/${p.whatsapp}

Happy to share more examples or hop on a quick call.

(ref: ${job.id})`;
}

async function main() {
  const seen = loadSeen();
  const apps = loadApps();

  const jobBoardPosts = [
    ...(await fetchRemoteOK()),
    ...(await fetchArbeitnow()),
    ...(await fetchJobicy()),
    ...(await fetchWeWorkRemotelyDesign()),
  ];
  const musicPosts = await fetchReddit(config.music.subreddits);
  const creativeCommunityPosts = await fetchReddit(config.creativeCommunity.subreddits);

  const matchedCreative = jobBoardPosts
    .filter((j) => matchesKeywords(j.text))
    .map((j) => ({ ...j, category: "creative" }));
  const matchedCreativeCommunity = creativeCommunityPosts
    .filter((j) => matchesCreativeCommunity(j.text))
    .map((j) => ({ ...j, category: "creative" }));
  const matchedMusic = musicPosts
    .filter((j) => matchesMusic(j.text))
    .map((j) => ({ ...j, category: "music" }));

  const matched = [...matchedCreative, ...matchedCreativeCommunity, ...matchedMusic];
  const newJobs = matched.filter((j) => !seen[j.id]);

  console.log(
    `Job boards: ${jobBoardPosts.length} checked, ${matchedCreative.length} matched. ` +
      `Creative communities: ${creativeCommunityPosts.length} checked, ${matchedCreativeCommunity.length} matched. ` +
      `Music communities: ${musicPosts.length} checked, ${matchedMusic.length} matched. ` +
      `${newJobs.length} new overall.`
  );

  if (newJobs.length === 0) {
    console.log("No new matches today.");
    return;
  }

  newJobs.forEach((j) => {
    seen[j.id] = true;
    apps[j.id] = { title: j.title, company: j.company, url: j.url, category: j.category, status: "new", firstSeen: new Date().toISOString() };
  });
  saveSeen(seen);
  saveApps(apps);

  const htmlList = newJobs
    .map((j) => {
      const pitch = buildPitch(j);
      const mailtoBody = encodeURIComponent(pitch);
      const mailtoLink = `mailto:?subject=${encodeURIComponent(
        `Application: ${j.title}`
      )}&body=${mailtoBody}`;
      return `<li style="margin-bottom:24px;">
        <b>${j.title}</b> — ${j.company} (${j.source})<br>
        <a href="${j.url}">${j.url}</a><br><br>
        <a href="${mailtoLink}" style="background:#D9A441;color:#0B0F14;padding:8px 14px;text-decoration:none;border-radius:3px;display:inline-block;">Open draft reply in email</a>
        <details style="margin-top:8px;"><summary>Or copy this pitch</summary><pre style="white-space:pre-wrap;font-family:inherit;">${pitch}</pre></details>
      </li>`;
    })
    .join("");
  const textList = newJobs
    .map((j) => `• ${j.title} — ${j.company}\n${j.url}\n\nSuggested reply:\n${buildPitch(j)}`)
    .join("\n\n---\n\n");

  await sendEmail(
    `${newJobs.length} new job match${newJobs.length > 1 ? "es" : ""} today`,
    `<h2>New matches</h2><ul>${htmlList}</ul>`
  );

  await sendWhatsApp(`${newJobs.length} new job match(es) today:\n\n${textList}`);
}

main();