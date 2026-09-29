# Rahul V R — Portfolio Website + Admin Panel

Two things get deployed, to two different places:

1. **The public website + admin dashboard (frontend only)** — plain HTML/CSS/JS, hosted for free on **GitHub Pages**.
2. **The admin API** — the part that checks your PIN and actually writes to GitHub — a small serverless app hosted for free on **Vercel** (GitHub Pages cannot run server code, so this piece has to live elsewhere).

They talk to each other over the internet (with cookies + CORS), so the site works as one site to you, even though it's two deployments.

Budget about 20–30 minutes. Everything below is written for **Windows**.

---

## 0. What you'll need installed

- **Git for Windows** → https://git-scm.com/download/win
- **Node.js LTS** (v18+) → https://nodejs.org — only used to generate one secret value locally
- A **GitHub account**
- A free **Vercel account** → https://vercel.com/signup (sign up with GitHub, it's easiest)

---

## 1. Create the GitHub repository and push the code

1. On GitHub, click **New repository**, name it `rahul-v-r-portfolio`, set it to **Public**, and don't initialize it with anything.
2. In PowerShell, `cd` into this project folder, then:

```powershell
git init
git add .
git commit -m "Initial portfolio site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/rahul-v-r-portfolio.git
git push -u origin main
```

---

## 2. Turn on GitHub Pages

1. Repo → **Settings → Pages** → under **Source**, choose **GitHub Actions**.
2. Check the **Actions** tab — the included workflow should already be running or have finished (green check).
3. Your site is now live at `https://YOUR-USERNAME.github.io/rahul-v-r-portfolio/`, and the admin login at `.../admin/` — though login won't work until Step 4 below.

---

## 3. Generate a session secret

In PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the string it prints — you'll paste it into Vercel in Step 5.

---

## 4. Create a GitHub Personal Access Token

This is what the *server* uses to commit content/media to your repo — separate from your admin PIN.

1. Go to https://github.com/settings/personal-access-tokens/new
2. **Token name**: `rahul-vr-portfolio-admin-write`
3. **Repository access** → "Only select repositories" → choose `rahul-v-r-portfolio`
4. **Permissions → Repository permissions → Contents** → set to **Read and write**
5. Generate, and copy the token. **Paste it only into Vercel in the next step — never into a chat or a screenshot.**

---

## 5. Deploy the API to Vercel

1. Go to https://vercel.com/new and import the `rahul-v-r-portfolio` repo.
2. Leave **Root Directory** as `./`.
3. Open **Environment Variables** and add these — **Key** is the variable name on the left, **Value** is the actual secret on the right:

   | Key | Value |
   |---|---|
   | `GITHUB_TOKEN` | the PAT from Step 4 |
   | `GITHUB_OWNER` | `SrikanthSR21` |
   | `GITHUB_REPO` | `rahul-v-r-portfolio` |
   | `GITHUB_BRANCH` | `main` |
   | `ADMIN_PIN` | a PIN or password only you know — this is what unlocks `/admin/` |
   | `SESSION_SECRET` | the random string from Step 3 |
   | `SITE_URL` | `https://srikanthsr21.github.io/rahul-v-r-portfolio` (no trailing slash) |

4. Click **Deploy**. When it finishes, copy the `.vercel.app` URL it gives you (this part is fine to share/note down — it's not secret).

---

## 6. Point the static site at your API

Open `config.js` in the project root and set:

```js
window.SITE_CONFIG = {
  API_BASE_URL: "https://YOUR-VERCEL-URL",   // no trailing slash
  GITHUB_REPO: "SrikanthSR21/rahul-v-r-portfolio"
};
```

Then:

```powershell
git add config.js
git commit -m "Point admin panel at deployed API"
git push
```

Wait ~1–2 minutes for the Actions tab to show the Pages deploy finished.

---

## 7. Test everything

- Open `/admin/` directly (not by clicking through the site) — the PIN screen should appear, including after a refresh.
- Enter the wrong PIN — you should see "Incorrect PIN" and stay locked out.
- Enter the correct PIN — you should land on the dashboard.
- Edit a text field, click **Preview** — a draft should render without publishing.
- Click **Publish Changes** — check your repo's commit history for a new commit within a few seconds.
- Upload a small photo, publish, and confirm it shows up in `media/images/` in the repo and on the live site once the Pages deploy finishes.
- Check the site on your phone and on desktop.

---

## Everyday use after setup

- Edit content any time at `/admin/` with your PIN. Changes only go live after **Publish Changes**.
- For videos over 50MB, paste an external URL (e.g. an unlisted YouTube/Vimeo link) into the video field instead of uploading — GitHub isn't built for large video hosting.
- If a publish/upload fails, the dashboard shows the exact server error — start there.
- To change your PIN later: edit `ADMIN_PIN` in Vercel's Environment Variables, then redeploy (Deployments tab → ⋯ → Redeploy).

## How it works

- All page content lives in one file, `content/site-content.json`. The public site just reads it — no build step, so publishing is close to instant.
- The admin dashboard never talks to GitHub directly — it goes through the serverless API, which holds the real GitHub write token server-side. Your browser only ever holds a short-lived signed session cookie.
- `/admin/` isn't secret by hiding the URL — the PIN and server-side check are the actual security.
