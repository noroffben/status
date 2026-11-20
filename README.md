# Status site

Visitors open `/` to see if I'm around. The admin opens a secret link, picks a status, and adds an optional note. No password.

## Deploy (Render + GitHub)

1. Put `server.js`, `package.json`, and this README in your GitHub repo (replace the old code).
2. On Render, use a Web Service with:
   - Build command: `npm install`
   - Start command: `npm start`
3. Add these environment variables in Render:
   - `SITE_NAME` : the name shown at the top, e.g. `Joe's Kitchen`
   - `ADMIN_KEY` : a long secret word with no spaces, e.g. `soup-pot-8472-kitchen`
4. The admin link is `https://YOUR-SITE.onrender.com/admin/YOUR-ADMIN_KEY`. Bookmark it on the phone and keep it private.
5. In UptimeRobot, monitor `https://YOUR-SITE.onrender.com/health` every 5 minutes.

## Notes

- The status is saved in a small file. Render's free tier wipes it on redeploy, and the status goes back to "Not today". The admin just sets it again.
- To change the status choices, edit the `STATUSES` block at the top of `server.js`.
- Anyone with the admin link can change the status, so don't share it. To change the link, change `ADMIN_KEY` in Render.
- A separate `admin.` address needs a custom domain on Render. The secret link works without one.
