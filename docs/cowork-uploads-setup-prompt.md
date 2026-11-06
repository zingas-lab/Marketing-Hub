# Turn on social media uploads

Paste everything below the line into Claude Cowork (Claude desktop app → Cowork). This assumes the hub is already live on Vercel. Before you start, make sure Chrome is signed into Google as braden@zingashome.com and into Vercel, and that Claude in Chrome is on.

---

Turn on video uploads for Zinga's Marketing Hub. The hub is already live on Vercel, and the upload feature is already built and pushed to GitHub. The job is a few settings in Google Drive and Vercel, done in my Chrome browser, where I'm already signed in. Stop and ask me if a screen doesn't match these steps, and don't change anything that isn't listed here.

**Facts you'll need**
- Google account: braden@zingashome.com
- Google Cloud project: "Zingas Marketing Hub"
- Settings sheet: https://docs.google.com/spreadsheets/d/1w3fw_B5LXguyuGTK7LmwnROwxgsE3oSv-dOUkMRI9_4/edit
- GitHub repo `zingas-lab/Marketing-Hub`, branch `claude/determined-archimedes-r6o59o`. The latest commit is "Add a Social media page with monthly scripts and per-script video uploads".

**1. Find the hub's service account email**
Go to console.cloud.google.com, select the "Zingas Marketing Hub" project, then IAM & Admin → Service Accounts. Copy the email of the `marketing-hub` account (it ends in `iam.gserviceaccount.com`). Call it SA_EMAIL below.

**2. Create the Shared Drive**
1. In Google Drive: Shared drives → New → name it `Franchisee Uploads`.
2. Manage members → add SA_EMAIL as **Manager**. Turn off "Notify people". If Drive warns that the address is outside the organization, allow it.
3. Open the Shared Drive's settings and turn on sharing with people outside Zinga's, so franchisees signed in with Gmail accounts can see their folders. If that option is greyed out, don't go into the Workspace admin console. Just tell me at the end.
4. Open the Shared Drive and copy its ID from the address bar (the part after `/folders/`). Call it UPLOADS_ID.

**3. Add two settings in Vercel**
1. Open the hub's project at vercel.com → Settings → Environment Variables. Add both of these for all environments:
   - `HUB_UPLOADS_FOLDER_ID` = UPLOADS_ID
   - `CRON_SECRET` = a new random 32-character secret, e.g. from https://generate-secret.vercel.app/32. It must be different from `AUTH_SECRET`.
2. Go to Deployments. Check that the latest production deployment is from the commit "Add a Social media page with monthly scripts and per-script video uploads". Redeploy it so the new settings take effect.
3. Settings → Cron Jobs should now list `/api/cron/social-folders`, running daily. Call the hub's live address DOMAIN below.

**4. Give me a location**
Uploads are filed by location, using the Location column on the Users tab of the settings sheet. Ask me which location to list me under. Put my answer in the Location cell of my row (braden@zingashome.com), and change nothing else on the sheet.

**5. Test it**
1. Wait 5 minutes for the hub to pick up the sheet change, then open `https://DOMAIN/social` and sign in if asked.
2. You should see the November 2026 scripts, each with an "Upload videos" box. At the top it should say uploads save to Google Drive in my location's folder.
3. Upload a short video to the first script. Use any small video file on this computer, or ask me for one. Watch the progress bar finish, and check the file appears in that script's list.
4. While it uploads, open Chrome DevTools → Network and note where the file data went: straight to `www.googleapis.com`, or to `/api/social/uploads/chunk` on the hub. I need to know which one.
5. In Google Drive, open Franchisee Uploads. Check there's a folder for my location, containing `2026-11 November`, a folder per script, and the test video in the first script's folder.
6. Back in the hub, click Remove on the test video and confirm. It should leave the list and go to the Shared Drive's trash.
7. In Vercel → Settings → Cron Jobs, click Run on `/api/cron/social-folders`. Then check Logs, or the response, for errors.

**6. Report back**
Tell me:
- whether each step worked;
- where the upload data went (step 5.4);
- any error messages, word for word;
- whether outside sharing was greyed out in step 2.3.

If something fails:
- A note saying "Uploads need a Shared Drive" means `HUB_UPLOADS_FOLDER_ID` isn't set, or the deployment wasn't redeployed.
- "Google Drive isn't responding for uploads" usually means SA_EMAIL isn't a Manager on the Shared Drive, or the ID was copied wrong.
- "No locations yet" means the Location cell is empty, or the 5-minute wait isn't over.
