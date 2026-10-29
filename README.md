# Zinga's Marketing Hub

One place for franchise owners and their teams to find approved logos, job photos, videos and print files, order print and apparel, and check the brand rules.

Files live in **Google Drive**. The hub reads a single Drive folder and shows it as a searchable, browsable library, so the marketing team keeps working in Drive and the hub updates on its own. Links, announcements and the list of who can sign in live in a **Google Sheet**, so none of it needs a code change.

## What's in it

| Page | What franchisees do there |
|---|---|
| **Home** | Search, jump to the Vistaprint and merch stores, see announcements and recently added files |
| **Library** | Browse the Drive folder by category, preview files, download them |
| **Search** | Find files by name, product or folder, filtered by type (images, videos, PDFs, design files, documents) |
| **Brand** | Logo do's and don'ts, logo downloads, colors with copyable HEX/RGB/CMYK, type, voice |
| **Order & shop** | Every link from the settings sheet: print store, merch store, vendors, design requests |

Previews: images show full size, videos play in the page, PDFs open in a viewer. Google Docs, Sheets and Slides download as PDF. Franchisees never need their own Drive access, because every file streams through the hub.

## Try it locally

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. With no credentials set, the hub runs on sample content that mirrors the real folder layout, so you can click around before anything is connected.

## How content works

### The Drive folder

Make one folder for the hub, for example **Franchise Marketing Hub**. Its subfolders become the library categories, and anything nested inside them shows up as folders within that category. A starting layout:

```
Franchise Marketing Hub/
  Logos & Brand/        logo lockups (PNG, SVG, EPS, AI), brand guide PDF
    Fonts/
  Job Photos/
    Pergolas/  Motorized Screens/  Retractable Awnings/  Window Treatments/
  Video/
  Print/
    Door Hangers/  Yard Signs/  Business Cards/  Vehicle Wrap/  Catalog/  Home Show/
  Social Media/
  Email Templates/
```

- **Folder descriptions show up in the hub.** In Drive, right-click a folder → *Folder information* → *Description*.
- **Use shortcuts to add existing folders without moving them.** Right-click a folder elsewhere in Drive → *Organize* → *Add shortcut*, and put the shortcut in the hub folder. The service account needs access to the original folder too.
- **Hide drafts.** Any file or folder whose name starts with `_` stays in Drive but doesn't appear in the hub.
- **The Brand page's logo downloads** come from the first folder with "logo" in its name.
- **Category cover photos** come from the first JPG in each category, so put your best photo first, alphabetically.
- **Changes appear within 5 minutes** (set by `HUB_CACHE_SECONDS`).

Keep internal material (sales call transcripts, CRM exports, reports) out of this folder. Everything in it is visible to every franchisee.

### The settings sheet

Create a Google Sheet with three tabs, named exactly as below. Row 1 of each tab is a header row.

**Links**: shown on Order & shop. Rows with a section containing "order" or "shop" also appear on the home page (the first two).

| Section | Title | Description | URL | Button label |
|---|---|---|---|---|
| Order & shop | Order print | Door hangers, yard signs, business cards… | https://… | Open the Vistaprint store |
| Order & shop | Shop apparel | Polos, hats and jackets for your crew… | https://… | Open the merch store |
| Approved vendors | Vehicle wraps | … | https://… | Get a quote |
| Get help | Request a design | Need something that isn't in the library? | https://forms.gle/… | Send a design request |

**Announcements**: the newest four show on the home page.

| Date | Title | Message | Link |
|---|---|---|---|
| 2026-10-27 | Fall outdoor catalog is live | It's in Print → Catalog and loaded in the Vistaprint store. | |

**Users**: who can sign in, besides anyone at a domain in `HUB_ALLOWED_DOMAINS`. The name and location personalize the home page. `admin` adds footer links to the Drive folder and this sheet, and an *Open in Drive* button on previews.

| Email | Name | Location | Role |
|---|---|---|---|
| owner@gmail.com | Mike Smith | Nashville, TN | franchisee |

Removing someone from this tab locks them out within the cache window.

## Setup

You need a Google Cloud project (free), and somewhere to host the app. These steps use Vercel, which has a free tier and deploys straight from this GitHub repo.

### 1. Google Cloud: service account (reads Drive and the sheet)

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project (e.g. "Zinga's Marketing Hub").
2. **APIs & Services → Library**: enable **Google Drive API** and **Google Sheets API**.
3. **IAM & Admin → Service Accounts → Create service account**. Name it `marketing-hub`. No roles are needed.
4. Open the service account → **Keys → Add key → JSON**. Keep the downloaded file safe, because it grants read access to whatever you share with it.
5. Copy the service account's email (ends in `iam.gserviceaccount.com`). In Drive, **share the hub folder and the settings sheet with that email as Viewer**.

### 2. Google Cloud: sign-in

1. **APIs & Services → OAuth consent screen**. If every hub user will have a `@zingashome.com` Google account, choose **Internal**. If franchisees will sign in with their own Gmail or other Google accounts, choose **External**. The hub only asks for name and email, so it doesn't need Google's app verification.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**
   - Authorized redirect URI: `https://YOUR-DOMAIN/api/auth/callback/google`
   - For local testing, also add `http://localhost:3000/api/auth/callback/google`
3. Copy the client ID and client secret.

A franchisee without a Google account can make one for their existing email at [accounts.google.com/signup](https://accounts.google.com/signup) ("Use my current email address instead").

### 3. Deploy to Vercel

1. At [vercel.com](https://vercel.com), **Add New → Project**, import `zingas-lab/marketing-hub`. The defaults are right for Next.js.
2. Add the environment variables from `.env.example`:

| Variable | Value |
|---|---|
| `HUB_DRIVE_FOLDER_ID` | The ID from the hub folder's URL: `drive.google.com/drive/folders/THIS_PART` |
| `HUB_SETTINGS_SHEET_ID` | The ID from the sheet's URL: `docs.google.com/spreadsheets/d/THIS_PART/edit` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Contents of the JSON key file. Base64 is safest: `base64 -i key.json \| tr -d '\n'` |
| `AUTH_SECRET` | Output of `npx auth secret` or `openssl rand -base64 33` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | From step 2 |
| `HUB_ALLOWED_DOMAINS` | `zingashome.com` |
| `HUB_ADMIN_EMAILS` | Your email |
| `HUB_SUPPORT_EMAIL` | Where franchisees send questions |

3. Deploy. To use your own address, like `hub.zingashome.com`, add it under **Settings → Domains**, then update the redirect URI in step 2.

## Project layout

```
app/(hub)/            signed-in pages: home, library, search, brand, shop
app/login/            sign-in page
app/api/files/[id]/   thumbnail and download streaming from Drive
lib/drive.ts          reads the Drive folder tree into a cached index; search
lib/settings.ts       reads the settings sheet
lib/session.ts        who's signed in, and whether they're still allowed
lib/demo.ts           sample content for local previews
auth.ts               Google sign-in (Auth.js)
```

Built with Next.js 15, Auth.js and the Google Drive and Sheets APIs. There's no database.

## What's next

The hub is built to grow into the rest of the plan:

- **Localized templates.** Franchisees fill in their phone number and territory, and the hub produces a print-ready PDF (Canva brand templates, or the Adobe connector).
- **Campaign kits and a marketing calendar.** A "Campaigns" tab in the settings sheet, each pointing to a Drive folder.
- **Photo submissions.** Techs upload job photos from the field into an `_Inbox` folder for approval.
- **Usage tracking.** Log downloads to a sheet to see which assets get used and by which territories.
- **Territory dashboards.** Leads, calls and reviews per location, from Improveit 360 and Google Business Profile.
- **Zip download** of a whole folder.
