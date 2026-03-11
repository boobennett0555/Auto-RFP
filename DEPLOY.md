# RFP Studio — Deployment Guide
## GitHub → Vercel → Supabase

Follow these steps in order. The whole setup takes about 30–45 minutes.

---

## Step 1 — Supabase Setup

1. Go to **supabase.com** → New Project
   - Choose a name (e.g. `rfp-studio`) and a strong database password
   - Select the closest region to your team
   - Wait ~2 minutes for provisioning

2. Go to **Settings → API** and copy:
   - `Project URL` → you'll need this soon
   - `anon public` key → you'll need this soon

3. Go to **SQL Editor → New Query**, paste the entire contents of
   `supabase/schema.sql`, and click **Run**
   - This creates all 4 tables, sets up security, and creates the image storage bucket
   - You should see "Success. No rows returned" for each statement

4. Go to **Authentication → URL Configuration**
   - Add your Vercel URL to **Redirect URLs** (you'll get this in Step 3)
   - For now add `http://localhost:3000/auth/callback` so local dev works
   - Format: `https://your-app.vercel.app/auth/callback`

5. Go to **Authentication → Email Templates** (optional but recommended)
   - Customize the magic link email with your company name and branding

---

## Step 2 — GitHub Setup

1. Create a **new repository** on github.com
   - Name: `rfp-studio`
   - Private: ✅ (recommended — this is an internal tool)
   - Don't initialize with README (you already have files)

2. In your terminal, from the `rfp-studio` folder:

```bash
git init
git add .
git commit -m "Initial commit — RFP Studio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rfp-studio.git
git push -u origin main
```

---

## Step 3 — Vercel Setup

1. Go to **vercel.com** → New Project → Import from GitHub
   - Select your `rfp-studio` repository
   - Framework: **Next.js** (auto-detected)
   - Click **Deploy** (it will fail — that's OK, we need env vars first)

2. Go to your project in Vercel → **Settings → Environment Variables**
   Add these three:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `ANTHROPIC_API_KEY` | Your key from console.anthropic.com |

3. Go to **Deployments → Redeploy** (top deployment → 3-dot menu → Redeploy)

4. Copy your live URL (e.g. `https://rfp-studio-xyz.vercel.app`)

5. Go back to **Supabase → Authentication → URL Configuration**
   - Add `https://your-app.vercel.app/auth/callback` to Redirect URLs

---

## Step 4 — Local Development

Create a `.env.local` file (never commit this):

```bash
cp .env.local.example .env.local
```

Fill in your three values, then:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Step 5 — Invite Your Team

1. Team members visit your Vercel URL
2. They enter their work email and click "Send Magic Link"
3. They click the link in their email → they're in
4. **All knowledge base entries, RFPs, and settings are shared** across the whole team

To control access: only people whose emails you share the URL with can get in
(Supabase only sends magic links — no one can sign up without the link).

For tighter control, you can whitelist specific email domains in:
**Supabase → Authentication → Providers → Email → Allowed domains**

---

## Step 6 — First Use Checklist

- [ ] Go to **Settings** and enter your company name, colors, and contact info
- [ ] Go to **Knowledge Base → Import from Past RFP** and paste 3–5 old RFPs + responses
- [ ] Create a **New RFP** with a real or test RFP to verify AI drafting works
- [ ] Export a **PPTX** to confirm branding looks right
- [ ] Share the URL with your team

---

## Ongoing Workflow

**Every time you make code changes:**
```bash
git add .
git commit -m "Description of change"
git push
```
Vercel redeploys automatically — usually live within 60 seconds.

---

## Troubleshooting

**Magic link not arriving:** Check spam folder. In Supabase, verify the redirect URL includes `/auth/callback`.

**"Unauthorized" errors:** Make sure your Supabase URL and anon key are correct in Vercel env vars, and that you've redeployed after adding them.

**PPTX export not working:** The PptxGenJS library loads from CDN on first use. Try clicking Export again after a few seconds.

**Images not uploading:** Verify the `rfp-images` storage bucket exists in Supabase Storage and has the public policy applied (check the SQL ran successfully).

**AI drafts are generic:** Import more past RFP responses into the Knowledge Base — the more entries, the better the AI drafts.
