# Deployment Reminder: Supabase Keep-Alive Cron Setup

Once you deploy this project to Vercel, follow these quick steps to enable the database keep-alive ping:

## 1. Set Environment Variables in Vercel
Go to **Vercel Project Settings** -> **Environment Variables** and add:
- **Key**: `CRON_SECRET`
- **Value**: `heritage_billing_keepalive_secret_2026`

*(Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_API_KEY` are also set in Vercel).*

## 2. Deploy the Project files
Ensure you have committed and pushed the following files to your repository:
- `vercel.json` (located in the root folder, configures the daily schedule)
- `app/api/keepalive/route.js` (the API endpoint that pings the DB)

## 3. Test and Verify
1. Go to **Vercel Settings** -> **Cron Jobs**.
2. Click **Run** on the `/api/keepalive` job to test it manually.
3. Check your `keepalive` table in the Supabase Table Editor; the `pinged_at` timestamp should be updated.
