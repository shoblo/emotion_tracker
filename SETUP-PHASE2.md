# Phase 2: put the app online and try it

You need three things done, in this order: A (AI function), B (code on GitHub), C (Vercel).
Menu names in the dashboards may differ slightly from what is written here.

## A. Supabase: deploy the AI function

1. Supabase dashboard -> **Edge Functions** -> **Deploy a new function** -> **Via Editor**.
2. Name it exactly `analyze-entry`.
3. Delete the sample code, paste the whole content of `supabase/functions/analyze-entry/index.ts`, click **Deploy**.
   Leave "Verify JWT" switched ON.
4. Edge Functions -> **Secrets** -> add a secret named `ANTHROPIC_API_KEY` with your Anthropic API key as the value.
   Type it only into this box. Do not paste it in chat or in any file.

## B. GitHub: upload the code

1. github.com -> **New repository** -> name `daily-checkin` -> **Private** -> Create.
2. Unzip `daily-checkin.zip` on your computer.
3. In the new repo choose **uploading an existing file**, drag in everything from inside the unzipped folder
   (the `src` folder, `supabase` folder, `package.json`, `index.html`, etc.), then **Commit changes**.
   Do not upload a file called `.env` (there isn't one in the zip).

## C. Vercel: publish

1. vercel.com -> **Add New... -> Project** -> import the `daily-checkin` repository.
2. Framework should show **Vite**. Leave build settings as they are.
3. Open **Environment Variables** and add these two (values are in `.env.example`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Click **Deploy**. When finished, open the address Vercel shows, on your phone.
5. Sign in with the parent account.

## First test (on your phone, in Chrome)

1. Tap the microphone, allow access, say a short report in Chinese, tap again to stop.
2. Fix any wrong words in the text box, tap **Analyse**.
3. Check the colour and fields, tap **Save**.
4. Try three reports: (a) happy day, (b) cried but stayed, (c) picked up early. Expected colours: green, yellow, red.

## If something goes wrong

| What you see | Likely cause |
|---|---|
| "Only a parent account can analyse entries" | The migration `0001_init.sql` was not run, or your account is not `parent` |
| "The server is missing its configuration" | Secret `ANTHROPIC_API_KEY` not added (step A4) |
| "The app is not configured yet" | The two environment variables are missing in Vercel; add them, then **Redeploy** |
| Sign-in fails | Check the password in Supabase -> Authentication -> Users |
| Microphone does nothing | Use Chrome, allow the microphone, or type / use the keyboard's own microphone |
| Vercel build fails | Copy the red error text from the build log and send it to me |
