# Deploying the demo live on Cloudflare Pages

This app is a **fully static site** (Next.js `output: "export"`). It needs no
server, no database, and no secrets. Publishing it as its **own Cloudflare Pages
project** means it goes live at its own URL **without touching your existing
paolodomingo.com site**.

## 1. One-time: create a separate Pages project

1. Push this folder to your GitHub repo (it lives in its own subfolder).
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, and select the repository.
3. In **Build settings**, set:

   | Setting | Value |
   |---|---|
   | **Project name** | e.g. `certifyhub-demo` (becomes `certifyhub-demo.pages.dev`) |
   | **Production branch** | `main` (or whichever branch holds this folder) |
   | **Framework preset** | `Next.js (Static HTML Export)` |
   | **Build command** | `npm run build` |
   | **Build output directory** | `out` |
   | **Root directory** *(Advanced)* | the path to this folder, e.g. `certifyhub-demo` |

   > The **Root directory** is the key setting — it tells Cloudflare to build
   > *only this subfolder*, so your main site's build is completely unaffected.

4. Click **Save and Deploy**. First build takes ~2–3 minutes. You'll get a live
   URL like `https://certifyhub-demo.pages.dev`.

No environment variables are required. The live site runs in **mock mode**
(canned content, zero cost, safe for the public). Real generation is opt-in per
visitor via their own Anthropic key — nothing to configure on the server.

## 2. Optional: custom subdomain

To serve it at `demo.paolodomingo.com`:

1. In the Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter `demo.paolodomingo.com`. If `paolodomingo.com` is already on Cloudflare,
   the DNS record is added automatically; otherwise follow the CNAME instructions.
3. Wait for the certificate to issue (usually a minute or two).

## 3. Link it from your website

On paolodomingo.com, add a button/link:

```html
<a href="https://demo.paolodomingo.com" target="_blank" rel="noopener">
  Try the live AI course demo →
</a>
```

## 4. Updates

Every push to the production branch triggers an automatic rebuild and redeploy —
no manual step. To preview changes first, push to any other branch and Cloudflare
creates a preview URL.

## Verifying locally before you deploy

```bash
cd <this folder>
npm install
npm run build         # produces the static site in ./out
npx serve out         # serve it exactly as Cloudflare will  → http://localhost:3000
```

If it works from `./out` locally, it works on Cloudflare Pages.

## Notes & gotchas

- **Won't affect your main site.** Because this is a separate Pages project with
  its own Root directory, your existing site's build and deployment are untouched.
- **Mock vs live.** Public visitors get mock mode (free, safe). Anyone who wants
  real generation taps the mode badge and pastes their **own** Anthropic key,
  which stays in their browser only. You are never billed for visitor usage.
- **Node version.** If the build fails on an old Node, set an environment
  variable `NODE_VERSION` = `20` (or `22`) in the Pages project settings.
- **Not a static site host?** If you'd rather run it with live server-side AI
  (shared key, behind a login), that's a different deployment (Cloudflare
  Workers via the Next.js runtime, or Vercel) — ask and I'll set it up, but for a
  public demo the static + bring-your-own-key setup here is the safer default.
