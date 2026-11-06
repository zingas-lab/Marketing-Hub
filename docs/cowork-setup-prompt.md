# Deploy Zinga's Marketing Hub

Paste everything below the line into Claude Cowork (Claude desktop app → Cowork). Before you start, make sure Chrome is signed into Google as braden@zingashome.com and into GitHub with access to the zingas-lab organization, and that Claude in Chrome is turned on.

---

Deploy Zinga's Marketing Hub, a Next.js app, so franchise owners can sign in with Google and browse our marketing files. Everything is already built. The job is account setup in Google Cloud and Vercel, done in my Chrome browser, where I'm already signed in. Ask me before paying for anything, and stop to ask if a screen doesn't match these steps.

**Facts you'll need**
- GitHub repo: `zingas-lab/Marketing-Hub`, branch `claude/determined-archimedes-r6o59o`
- Google account: braden@zingashome.com
- Drive folder the hub reads ("Marketing Hub"): https://drive.google.com/drive/folders/1fkT35ANGDzNExE8VSyEvRu1QbE87loDG
- Folder ID: `1fkT35ANGDzNExE8VSyEvRu1QbE87loDG`
- Settings sheet ID: `1w3fw_B5LXguyuGTK7LmwnROwxgsE3oSv-dOUkMRI9_4`

**1. Google Cloud project** (console.cloud.google.com, signed in as braden@zingashome.com)
1. Create a project named `Zingas Marketing Hub`. Select it in the project picker for every step below.
2. APIs & Services → Library: enable **Google Drive API** and **Google Sheets API**.

**2. Service account** (lets the hub read the Drive folder)
1. IAM & Admin → Service Accounts → Create service account. Name: `marketing-hub`. Skip the optional role and user steps.
2. Open it → Keys → Add key → Create new key → JSON. A .json file downloads. Keep it; you'll paste its contents into Vercel in step 4.
3. Copy the service account's email (it ends in `iam.gserviceaccount.com`).
4. Open the Marketing Hub Drive folder link above → Share → add that email as **Viewer** → uncheck "Notify people" → Share. If Drive warns the address is outside the organization, allow it.
5. In Google Drive, create a Shared Drive: Shared drives → New → name it `Franchisee Uploads`. Manage members → add the service account email as **Manager** (no notification). In the Shared Drive's settings, allow sharing with people outside Zinga's, so franchisees on Gmail accounts can see their folders. If the setting is greyed out, tell me: it needs a Workspace admin change.
6. Copy the Shared Drive's ID from its URL (the part after `/folders/`). Call it UPLOADS_ID below.

**3. Vercel project** (vercel.com)
1. Sign in with GitHub. If there's no Vercel account, create a free Hobby one with GitHub.
2. Add New → Project → import `zingas-lab/Marketing-Hub`. If the repo isn't listed, use "Adjust GitHub App Permissions" to give Vercel access to the zingas-lab organization and this repo.
3. Keep the default Next.js settings and deploy. The first deploy shows a "Google sign-in is not configured" error. That's expected for now.
4. Settings → Git → set **Production Branch** to `claude/determined-archimedes-r6o59o` if it isn't already.
5. Note the production domain, e.g. `marketing-hub-xxxx.vercel.app`. Call it DOMAIN below.

**4. Google sign-in** (back in Google Cloud, same project)
1. APIs & Services → OAuth consent screen (may be called "Google Auth Platform"). User type **External**, because franchisees may sign in with non-zingashome Google accounts. App name `Zinga's Marketing Hub`, support and developer email braden@zingashome.com. Don't add any scopes beyond the defaults.
2. Under Audience, click **Publish app** so anyone on our allowed list can sign in, not just test users. With only the default scopes, Google doesn't require verification.
3. Clients (or Credentials → Create credentials → OAuth client ID) → Web application, name `Marketing Hub`. Authorized redirect URI: `https://DOMAIN/api/auth/callback/google`. Create it, then copy the Client ID and Client secret.

**5. Environment variables** (Vercel → Project → Settings → Environment Variables, applied to all environments)

| Name | Value |
|---|---|
| `HUB_DRIVE_FOLDER_ID` | `1fkT35ANGDzNExE8VSyEvRu1QbE87loDG` |
| `HUB_SETTINGS_SHEET_ID` | `1w3fw_B5LXguyuGTK7LmwnROwxgsE3oSv-dOUkMRI9_4` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The entire contents of the downloaded .json key file, pasted as is |
| `AUTH_SECRET` | A random 32-character secret, e.g. from https://generate-secret.vercel.app/32 |
| `AUTH_GOOGLE_ID` | Client ID from step 4 |
| `AUTH_GOOGLE_SECRET` | Client secret from step 4 |
| `HUB_ALLOWED_DOMAINS` | `zingashome.com` |
| `HUB_ADMIN_EMAILS` | `braden@zingashome.com` |
| `HUB_UPLOADS_FOLDER_ID` | UPLOADS_ID from step 2 |
| `CRON_SECRET` | Another random 32-character secret, different from `AUTH_SECRET` |

Then Deployments → latest → Redeploy.

**6. Check it works**
1. Open `https://DOMAIN`, click "Sign in with Google", and sign in as braden@zingashome.com.
2. The home page should show the Library with Logos & Brand, Photos, Video, Print, Social Media and Templates. Open Logos & Brand: the logo files should show previews and download.
3. The "Open the print store" and "Open the merch store" buttons should go to zingas.ourproshop.com and zingas.istoremerch.com.
4. Open **Social media**. The November scripts should show, each with an upload box. Upload one short test video to any script and check it appears in the list, and in the Franchisee Uploads Shared Drive under the location's folder. Then remove it.

**7. Clean up and report**
- Delete the downloaded .json key file from Downloads. It's a password for the Drive folder, and Vercel now has its own copy.
- Tell me the live URL, and anything that didn't go as described.

If something fails: an "AccessDenied" error at sign-in means the email isn't allowed (check `HUB_ALLOWED_DOMAINS`). Empty categories or a Drive error means the folder isn't shared with the service account, or the key was pasted incompletely. A "redirect_uri_mismatch" error means the redirect URI in step 4 doesn't exactly match the domain.
