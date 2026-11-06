# Zinga's Marketing Hub

One place for franchise owners and their teams to find approved logos, job photos, videos and print files, order print and apparel, and check the brand rules.

Files live in **Google Drive**. The hub reads a single Drive folder and shows it as a searchable, browsable library, so the marketing team keeps working in Drive and the hub updates on its own. Links, announcements and the list of who can sign in live in a **Google Sheet**, so none of it needs a code change.

## What's in it

| Page | What franchisees do there |
|---|---|
| **Home** | Search, jump to the Vistaprint and merch stores, see announcements and recently added files |
| **Library** | Browse the Drive folder by category, preview files, download them |
| **Social media** | Read this month's video scripts and shot lists, and upload clips under each script |
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

The hub shows the **[Marketing Hub](https://drive.google.com/drive/folders/1fkT35ANGDzNExE8VSyEvRu1QbE87loDG)** folder. Its subfolders are the library categories, and anything nested inside them shows up as folders within that category:

```
Marketing Hub/
  Logos & Brand/          logo lockups (PNG, SVG, EPS, AI)
    Fonts/
  Photos/                 by product line
    Louvered Pergolas/  Pergolas with Screens/  Motorized Screens/
    Retractable Awnings/  Outdoor Kitchens/  Window Treatments/
  Video/                  same product lines as Photos
  Print/                  print-ready files
    Door Hangers/  Yard Signs/  Business Cards/  Brochures & Catalogs/
    Vehicle Wraps/  Home Shows & Events/
  Social Media/           ready-to-post graphics and captions, by month
  Templates/              editable files franchisees customize
    Print Templates/  Social Media Templates/  Email Templates/  Presentations/
  _Hub Settings           the settings sheet (hidden from the hub)
```

To add something, drop it in the right folder. To add a new category, make a new folder at the top level.

- **Folder descriptions show up in the hub.** In Drive, right-click a folder → *Folder information* → *Description*.
- **Use shortcuts to add existing folders without moving them.** Right-click a folder elsewhere in Drive → *Organize* → *Add shortcut*, and put the shortcut in the hub folder. The service account needs access to the original folder too.
- **Hide drafts.** Any file or folder whose name starts with `_` stays in Drive but doesn't appear in the hub.
- **The Brand page's logo downloads** come from the first folder with "logo" in its name.
- **Category cover photos** come from the first JPG in each category, so put your best photo first, alphabetically.
- **Changes appear within 5 minutes** (set by `HUB_CACHE_SECONDS`).

Keep internal material (sales call transcripts, CRM exports, reports) out of this folder. Everything in it is visible to every franchisee.

### The settings sheet

**[_Hub Settings](https://docs.google.com/spreadsheets/d/1w3fw_B5LXguyuGTK7LmwnROwxgsE3oSv-dOUkMRI9_4/edit)** lives inside the Marketing Hub folder. The underscore keeps it out of the library, and sharing the folder with the service account covers the sheet too. It has three tabs, each with a header row. Keep the tab names as they are.

**Links**: shown on Order & shop. Rows with a section containing "order" or "shop" also appear on the home page (the first two).

| Section | Title | Description | URL | Button label |
|---|---|---|---|---|
| Order & shop | Order print | Door hangers, yard signs, business cards… | https://zingas.ourproshop.com | Open the print store |
| Order & shop | Shop apparel | Branded apparel and merchandise… | https://zingas.istoremerch.com/index.jsf | Open the merch store |
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

Removing someone from this tab locks them out within the cache window. **Location** also decides where a person's social media uploads go, so fill it in for every franchisee, and spell it the same way for everyone at the same location.

**Scripts**: monthly video ideas for the Social media page. One row per script.

| Month | Title | Script | Filming notes | Length | Example link |
|---|---|---|---|---|---|
| 2026-11 | Afternoon glare, fixed | What to say, one line per line break | One tip per line | 20 seconds | optional URL |

- **Month** is `YYYY-MM`. The column is formatted as plain text so Sheets doesn't turn it into a date.
- Line breaks inside a cell (Ctrl+Enter, or ⌘+Enter on a Mac) carry through: each line of the script shows as its own paragraph, and each line of filming notes becomes a bullet.
- **Don't rename a script after people have uploaded to it.** The title names its upload folder, so a new title starts a new, empty folder. The old uploads stay in Drive.

### Social media uploads

On the Social media page, franchisees see each script for the month next to an upload box. They can pick or drop as many videos and photos as they like per script, up to 10 GB each. Files upload in chunks with a progress bar and pick up where they left off after a dropped connection. They save to Google Drive here:

```
Franchisee Uploads (Shared Drive)/
  Omaha, NE/                      shared with everyone at that location
    2026-11 November/
      Afternoon glare, fixed/     one folder per script
        IMG_4021.MOV
```

- Folders are created automatically. Every morning (see `vercel.json`) the hub makes this month's folder and a folder per script for every location on the Users tab, and it fills any gaps whenever someone opens the page.
- Each location folder is shared with that location's people (edit access, no email), so it appears under **Shared with me** in their Google Drive. They can add files from the Drive app too, and those show up in the hub. Set `HUB_SHARE_UPLOAD_FOLDERS=0` to turn sharing off.
- Franchisees can remove their own uploads, which moves them to the Drive trash.
- Admins get a location picker to see, or upload for, any location.
- The uploads go into a **Shared Drive**, not a regular folder, because the hub's service account has no Drive storage of its own and can't own files in someone's My Drive. Files in a Shared Drive belong to Zinga's.

## Setup

You need a Google Cloud project (free), and somewhere to host the app. These steps use Vercel, which has a free tier and deploys straight from this GitHub repo.

### 1. Google Cloud: service account (reads Drive and the sheet)

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project (e.g. "Zinga's Marketing Hub").
2. **APIs & Services → Library**: enable **Google Drive API** and **Google Sheets API**.
3. **IAM & Admin → Service Accounts → Create service account**. Name it `marketing-hub`. No roles are needed.
4. Open the service account → **Keys → Add key → JSON**. Keep the downloaded file safe, because it grants read access to whatever you share with it.
5. Copy the service account's email (ends in `iam.gserviceaccount.com`). In Drive, **share the Marketing Hub folder with that email as Viewer**. The settings sheet is inside it, so it's covered.

### 2. Google Cloud: sign-in

1. **APIs & Services → OAuth consent screen**. If every hub user will have a `@zingashome.com` Google account, choose **Internal**. If franchisees will sign in with their own Gmail or other Google accounts, choose **External**. The hub only asks for name and email, so it doesn't need Google's app verification.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**
   - Authorized redirect URI: `https://YOUR-DOMAIN/api/auth/callback/google`
   - For local testing, also add `http://localhost:3000/api/auth/callback/google`
3. Copy the client ID and client secret.

A franchisee without a Google account can make one for their existing email at [accounts.google.com/signup](https://accounts.google.com/signup) ("Use my current email address instead").

### 3. Shared Drive for social media uploads

1. In Google Drive: **Shared drives → New**, name it `Franchisee Uploads`.
2. **Manage members**: add the service account email as **Manager**. Manager is needed so the hub can share each location's folder with that location.
3. If franchisees sign in with non-zingashome Google accounts: open the Shared Drive's settings and allow sharing with people outside Zinga's. Your Workspace admin settings must allow it as well.
4. Copy the Shared Drive's ID from its URL: `drive.google.com/drive/folders/THIS_PART`.

### 4. Deploy to Vercel

1. At [vercel.com](https://vercel.com), **Add New → Project**, import `zingas-lab/marketing-hub`. The defaults are right for Next.js.
2. Add the environment variables from `.env.example`:

| Variable | Value |
|---|---|
| `HUB_DRIVE_FOLDER_ID` | `1fkT35ANGDzNExE8VSyEvRu1QbE87loDG` (the Marketing Hub folder) |
| `HUB_SETTINGS_SHEET_ID` | `1w3fw_B5LXguyuGTK7LmwnROwxgsE3oSv-dOUkMRI9_4` (_Hub Settings) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Contents of the JSON key file. Base64 is safest: `base64 -i key.json \| tr -d '\n'` |
| `AUTH_SECRET` | Output of `npx auth secret` or `openssl rand -base64 33` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | From step 2 |
| `HUB_ALLOWED_DOMAINS` | `zingashome.com` |
| `HUB_ADMIN_EMAILS` | `braden@zingashome.com` |
| `HUB_SUPPORT_EMAIL` | Where franchisees send questions |
| `HUB_UPLOADS_FOLDER_ID` | The Shared Drive's ID from step 3 |
| `CRON_SECRET` | Any long random string. Vercel sends it with the daily folder job so nobody else can trigger it |

3. Deploy. To use your own address, like `hub.zingashome.com`, add it under **Settings → Domains**, then update the redirect URI in step 2.

## Project layout

```
app/(hub)/            signed-in pages: home, library, search, brand, shop
app/login/            sign-in page
app/api/files/[id]/   thumbnail and download streaming from Drive
lib/drive.ts          reads the Drive folder tree into a cached index; search
lib/settings.ts       reads the settings sheet
lib/uploads.ts        social media upload folders, resumable uploads to Drive
app/(hub)/social/     scripts and upload page
components/UploadPanel.tsx   multi-file chunked uploader
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
