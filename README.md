# Your freelance hub

Two pieces, working together:

1. **`site/`** — your portfolio page. Deploy it once, edit anytime.
2. **`aggregator/`** — a script that checks job listings daily and messages you when something matches.

Everything here is free to run. No server to maintain.

---

## 1. Personalize the site

Open `site/index.html` and replace:
- `YOUR NAME` — your name
- `971500000000` (both spots) — your WhatsApp number, digits only, country code first
- `you@example.com` — your email
- `linkedin.com/in/yourprofile` — your LinkedIn
- The "Recent work" cards — swap in real projects as you have them (even one is enough to start)
- The form's `action="https://formspree.io/f/YOUR_FORM_ID"` — see step 2

## 2. Make the contact form actually send

The form uses [Formspree](https://formspree.io) (free tier, no backend needed):
1. Sign up at formspree.io
2. Create a new form, copy the form ID it gives you
3. Paste it into the `action` URL in `index.html`

## 3. Put the site online (free, always-on)

Easiest path — **Vercel**:
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import the repo → set root directory to `site`
3. Deploy — you'll get a live URL in under a minute, and it auto-updates whenever you push changes

(Netlify or GitHub Pages work the same way if you prefer those.)

## 4. Set up your notification keys

Two free services, no card required:

**Email (Resend):**
1. Sign up at resend.com
2. Create an API key
3. You can send from `onboarding@resend.dev` immediately without verifying a domain (fine for personal alerts)

**WhatsApp (CallMeBot):**
1. Save this contact to your phone: **+34 644 59 71 67**
2. Send it the message: `I allow callmebot to send me messages`
3. You'll get a reply with your personal API key

Edit `aggregator/config.json` and set your real email address and WhatsApp number (these aren't secret, just preferences — keep the actual keys out of this file).

## 5. Automate it with GitHub Actions (free, runs even when your PC is off)

1. Push this whole folder to a GitHub repo
2. In the repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Add `RESEND_API_KEY` with your Resend key
   - Add `CALLMEBOT_APIKEY` with your CallMeBot key
3. That's it — `.github/workflows/job-alert.yml` runs daily at 06:00 UTC automatically. Change the `cron` line in that file to adjust the time.
4. To test it right now without waiting: go to the repo's **Actions** tab → select "Daily Job Alert" → **Run workflow**

## 6. Tune what counts as a match

Edit `aggregator/config.json`:
- `keywords` — anything matching these (case-insensitive) gets through
- `excludeKeywords` — anything matching these gets filtered out, even if it matched a keyword

Add your specific skills here too (e.g. `"python"`, `"react"`, `"data entry"`) to narrow the feed to things you'd actually take.

## Running it locally (optional)

```
cd aggregator
RESEND_API_KEY=your_key CALLMEBOT_APIKEY=your_key node fetch-jobs.js
```

---

## What this does and doesn't do

**Does:** checks RemoteOK and Arbeitnow (both public job boards with open APIs) daily, filters for your keywords, and pings you the first time it sees a match. Keeps a memory file (`seen-jobs.json`) so you're not notified about the same listing twice.

**Doesn't:** scrape LinkedIn, Upwork, Bayt, or similar platforms directly, or auto-apply/auto-message on your behalf. Those platforms prohibit scraping and automated outreach in their terms of service, and accounts doing that get banned. For those, check them manually a couple of times a week, or set up their native email alerts (most job boards have a "notify me" feature) — the digest from this system will tell you when to go look.

## Adding more sources later

Want more coverage? The two functions `fetchRemoteOK()` and `fetchArbeitnow()` in `fetch-jobs.js` are templates — any job board with a public JSON API or RSS feed can be added the same way (fetch, map to the standard shape, add to the array in `main()`). Himalayas, WeWorkRemotely (RSS), and Jobicy are good next additions. If a Gulf-specific board like Bayt or GulfTalent has an official API or partner feed, that's the legitimate way to plug them in — I can help you wire one up if you find it.
