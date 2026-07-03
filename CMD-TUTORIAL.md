# From zero to live — the full walkthrough

This assumes Windows (since you're using PowerShell/cmd). Every command below is
something you literally copy, paste, and press Enter on. Nothing is optional
unless I say so.

---

## STEP 0 — Open PowerShell

Press the **Windows key**, type `powershell`, press **Enter**.

A blue or black window opens with a blinking cursor. That's your command line.
Everything from here happens by typing (or pasting) a line, then pressing **Enter**.

To paste into PowerShell: copy the text normally (Ctrl+C), then **right-click**
inside the PowerShell window — it pastes automatically. (Ctrl+V also works in
modern PowerShell.)

---

## STEP 1 — Install Node.js

Node.js is what runs the JavaScript aggregator script.

1. Open your browser, go to **https://nodejs.org**
2. Click the big button that says **LTS** (not "Current")
3. Run the downloaded installer, click **Next** through all the defaults, then **Finish**
4. Close PowerShell completely and reopen it (Windows key → type `powershell` → Enter)
5. Paste this and press Enter to confirm it worked:

```
node -v
```

You should see something like `v20.x.x`. If you see an error, restart your computer and try again.

---

## STEP 2 — Install Git

Git is what lets you push your project to GitHub, which is what GitHub Actions
(your free automation) and Vercel (your free hosting) both plug into.

1. Go to **https://git-scm.com/download/win**
2. Download starts automatically. Run the installer.
3. Click **Next** through every screen, leaving defaults as they are. Click **Install**, then **Finish**.
4. Close and reopen PowerShell, then confirm:

```
git --version
```

You should see something like `git version 2.4x.x`.

---

## STEP 3 — Create a GitHub account

1. Go to **https://github.com**
2. Click **Sign up**, follow the steps (email, password, username)
3. Verify your email if it asks

---

## STEP 4 — Create a new empty repository on GitHub

1. Once logged in, click the **+** icon top-right → **New repository**
2. Repository name: `freelance-hub`
3. Leave it **Public** (or Private if you prefer — both work fine for this)
4. Do **NOT** check "Add a README" — leave everything unchecked
5. Click **Create repository**
6. GitHub now shows you a page with some commands and a URL like:
   `https://github.com/YOUR-USERNAME/freelance-hub.git`
   Keep this tab open — you'll need that URL in Step 6.

---

## STEP 5 — Put the project files on your computer

1. Download the `freelance-hub` folder I gave you and save it somewhere easy to find, e.g. your Desktop.
2. In PowerShell, navigate into it. Paste this (adjust the path if you saved it elsewhere):

```
cd Desktop\freelance-hub
```

Press Enter. If it worked, your prompt line now ends with `freelance-hub>`.

Confirm the files are there:

```
dir
```

You should see `site`, `aggregator`, `README.md`, and `.github` listed.

---

## STEP 6 — Push the project to GitHub

Still inside the `freelance-hub` folder in PowerShell, paste these **one at a time**,
pressing Enter after each:

```
git init
git add .
git commit -m "first version"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/freelance-hub.git
git push -u origin main
```

**Replace `YOUR-USERNAME`** with your actual GitHub username in that fifth line
(use the exact URL GitHub showed you in Step 4).

The first time you push, a browser window may pop up asking you to log into
GitHub — do that, then come back to PowerShell.

Go refresh your GitHub repository page in the browser — your files should now
be there.

---

## STEP 7 — Personalize the site

1. On your computer, open `freelance-hub\site\index.html` — right-click it →
   **Open with** → **Notepad** (or any text editor)
2. Find and replace: your name, WhatsApp number, email, LinkedIn link, and the
   "Recent work" section (see the README for exact spots)
3. Save the file (Ctrl+S)
4. Push the update to GitHub — back in PowerShell:

```
git add .
git commit -m "personalize site"
git push
```

You'll repeat this `git add .` / `git commit -m "..."` / `git push` pattern
every time you make a change to any file, from now on.

---

## STEP 8 — Put the site online (Vercel)

1. Go to **https://vercel.com** → **Sign up** → choose **Continue with GitHub**
   (this links your GitHub account automatically)
2. Click **Add New...** → **Project**
3. Find `freelance-hub` in the list → click **Import**
4. Where it says **Root Directory**, click **Edit** and set it to `site`
5. Leave everything else as default → click **Deploy**
6. Wait about 30–60 seconds. You'll get a live URL like `freelance-hub.vercel.app`
   — click it. Your site is now live on the internet.

Every time you `git push` after this, Vercel automatically updates the live site
within a minute. You never have to redeploy manually.

---

## STEP 9 — Get your Resend email key

1. Go to **https://resend.com** → **Sign up**
2. Once inside, go to **API Keys** in the left sidebar → **Create API Key**
3. Give it any name → click **Create**
4. **Copy the key immediately** (it starts with `re_`) — you won't be able to see it again. Paste it somewhere temporary like Notepad for now.

---

## STEP 10 — Get your WhatsApp key (CallMeBot)

1. On your phone, save this number as a contact: **+34 644 59 71 67**
2. Open WhatsApp, message that contact exactly this text:
   `I allow callmebot to send me messages`
3. Send it. Within a minute or two you'll get a reply containing your API key
   (a string of numbers). Copy it somewhere temporary too.

---

## STEP 11 — Add your keys to GitHub (safely)

This keeps your keys private — they never appear in your code.

1. Go to your repository on GitHub (`github.com/YOUR-USERNAME/freelance-hub`)
2. Click **Settings** (top menu of the repo, not your account settings)
3. In the left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
   - Name: `RESEND_API_KEY` → Value: paste your Resend key → **Add secret**
5. Click **New repository secret** again
   - Name: `CALLMEBOT_APIKEY` → Value: paste your CallMeBot key → **Add secret**

---

## STEP 12 — Set your email/phone preferences

1. Open `freelance-hub\aggregator\config.json` in Notepad
2. Change `"toAddress": "you@example.com"` to your real email
3. Change `"phone": "971500000000"` to your real WhatsApp number (digits only, country code first, no `+` or spaces)
4. Save, then push the change:

```
git add .
git commit -m "set my contact info"
git push
```

---

## STEP 13 — Turn on the automation

1. On GitHub, go to your repo → click the **Actions** tab at the top
2. You'll see **Daily Job Alert** listed on the left
3. Click it → click **Run workflow** (button on the right) → **Run workflow** again to confirm
4. Wait ~30 seconds, refresh the page — you'll see a run appear. Click into it
   to watch it work in real time (green checkmark = success)

From now on, this runs automatically every day at 06:00 UTC (10am UAE time) —
no computer, no PowerShell, nothing needed from you. You'll just get a
WhatsApp/email if there's a match.

---

## STEP 14 (optional) — Test it right now on your own computer

If you want to see it work locally before waiting for GitHub:

```
cd Desktop\freelance-hub\aggregator
$env:RESEND_API_KEY="paste_your_resend_key_here"
$env:CALLMEBOT_APIKEY="paste_your_callmebot_key_here"
node fetch-jobs.js
```

You'll see live output in PowerShell telling you how many jobs it checked and
matched.

---

## If something breaks

- **`git` or `node` not recognized** → you skipped restarting PowerShell after
  install. Close it fully and reopen.
- **`git push` asks for login repeatedly** → make sure you completed the
  browser login popup instead of closing it.
- **No WhatsApp/email arrives** → check the GitHub Actions run log (Step 13) —
  it will say plainly if a key is missing or wrong.
- **Stuck on anything** — copy the exact error message here and I'll tell you
  the fix.

That's the whole path, start to finish. Once Steps 1–13 are done once, you never
touch the command line again unless you want to change something.
