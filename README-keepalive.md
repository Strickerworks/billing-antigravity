# Supabase Keep-Alive Setup Guide

Supabase free tier projects are paused after 7 days of inactivity. To prevent this, you can automate a daily ping to your database. Below are the three best methods to implement this.

---

## Prerequisite: Create the Keep-Alive Table
First, run the following SQL in your **Supabase SQL Editor** to create a single-row keepalive tracker:

```sql
-- Create keep-alive table
CREATE TABLE IF NOT EXISTS keepalive (
  id INT PRIMARY KEY,
  pinged_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with a default row
INSERT INTO keepalive (id, pinged_at)
VALUES (1, now())
ON CONFLICT (id) DO NOTHING;

-- Disable RLS if you access it directly via API
ALTER TABLE keepalive DISABLE ROW LEVEL SECURITY;
```

---

## Option 1: Supabase `pg_cron` (Database Level - Recommended 🌟)
*No external services or servers required. Everything runs inside Supabase.*

1. Go to your **Supabase Dashboard** -> **Database** -> **Extensions**.
2. Search for `pg_cron` and enable it.
3. Go to the **SQL Editor** and run the following query to schedule a daily update:

```sql
-- Schedule a cron job to update the keepalive row every day at 12:00 AM UTC
SELECT cron.schedule(
  'supabase-keepalive', -- unique name of the cron job
  '0 0 * * *',          -- cron schedule (every day at midnight)
  $$ UPDATE keepalive SET pinged_at = now() WHERE id = 1; $$
);
```

To list or delete active cron jobs later, use:
```sql
-- List all active cron jobs
SELECT * FROM cron.job;

-- Unschedules/deletes the keepalive cron job
SELECT cron.unschedule('supabase-keepalive');
```

---

## Option 2: Vercel Crons (Serverless Endpoint ⚡)
*Uses your Next.js API endpoint `/api/keepalive` triggered by Vercel.*

This project is pre-configured with a `vercel.json` file. Once you deploy to Vercel:

1. Go to **Vercel Project Settings** -> **Environment Variables** and add:
   - **Key**: `CRON_SECRET`
   - **Value**: `heritage_billing_keepalive_secret_2026`
   *(Also ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_API_KEY` are configured).*
2. Deploy the project files to Vercel.
3. Test the setup:
   - Go to **Vercel Settings** -> **Cron Jobs**.
   - Click **Run** on the `/api/keepalive` job.
   - Verify the `pinged_at` column updates in your Supabase `keepalive` table.

---

## Option 3: GitHub Actions (Automated - Free & Easy 🛠️)
*If you host your code on GitHub, you can use a free GitHub Action to trigger the API endpoint.*

Create a file named `.github/workflows/keepalive.yml` in your project with the following contents:

```yaml
name: Database Keep-Alive

on:
  schedule:
    - cron: '0 0 * * *' # Runs everyday at midnight UTC
  workflow_dispatch: # Allows manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Keepalive API
        run: |
          curl -X GET "https://your-deployed-vercel-app-url.vercel.app/api/keepalive?secret=heritage_billing_keepalive_secret_2026"
```
