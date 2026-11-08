# Daily Check-in — Phase 1

## Architecture

```
 Phone / laptop (PWA, Vercel)                 Supabase (Sydney)
 ┌──────────────────────────┐   login (JWT)   ┌─────────────────────────────┐
 │ React + Vite + Tailwind  │ ──────────────► │ Auth (invite-only)          │
 │ Web Speech API (voice →  │                 │ Postgres + RLS              │
 │ text, editable)          │ ── text ──────► │ Edge Function analyze-entry │──► Claude API
 │ Recharts, PDF/CSV export │ ◄── JSON ────── │   (holds ANTHROPIC_API_KEY) │    (claude-haiku-5-5)
 └──────────────────────────┘                 └─────────────────────────────┘
        ▲                                                  ▲
        └── Vercel Cron, daily ── GET /api/keepalive ──────┘  (calls rpc ping, avoids 7-day pause)
```

Flow: record → browser transcribes (editable) → Edge Function sends text to Claude →
returns JSON (English transcript + flags) → code computes colour → parent reviews/edits → save.
The colour rule is enforced twice: in the app (`moodRules.ts`) and in the database (trigger `apply_entry_rules`).

Roles
- parent: read/write everything, sees original transcript.
- teacher: read-only through view `teacher_entries` (English fields only). No access to `daily_entries`.
- Signups are closed; accounts are created by invitation. First account ever created becomes the parent; everyone else defaults to teacher.

## Decisions to be aware of
- A meltdown always counts as an incident (so Yellow at minimum), even if the AI forgot to set `had_incident`.
- Teachers do not see `mood_overridden` or the original transcript.
- A second parent (e.g. your partner) is promoted with one SQL line (see below).

## Folder structure

```
daily-checkin/
├─ supabase/
│  ├─ migrations/0001_init.sql
│  └─ functions/analyze-entry/index.ts      (Phase 2)
├─ api/keepalive.ts                         (Phase 4, Vercel Cron target)
├─ public/ manifest.webmanifest, icons      (Phase 4)
├─ src/
│  ├─ pages/ Login, Record, TodayResult, History, EntryDetail, Insights, Export, Settings
│  ├─ components/ MoodFace, RecordButton, EntryCard, charts/
│  ├─ lib/ supabase.ts, moodRules.ts, analyze.ts, speech.ts, stats.ts, export.ts
│  └─ App.tsx, main.tsx
├─ vercel.json                              (cron schedule)
└─ package.json, vite.config.ts, tailwind.config.ts
```

## Promote a second parent (SQL Editor)

```sql
update public.profiles set role = 'parent'
where user_id = (select id from auth.users where email = 'partner@example.com');
```

## Account setup checklist (you do these; I can't sign up on your behalf)

Labels in each dashboard may differ slightly from what is written here.

1. **GitHub** (free): create an account; I will give you the code to put in a private repo.
2. **Supabase** (free plan): create a project, region **Sydney (ap-southeast-2)**, save the database password.
   - SQL Editor → paste and run `0001_init.sql`. Do this BEFORE creating any user.
   - Authentication settings → turn **off** "Allow new users to sign up".
   - Authentication → Users → add yourself first (becomes parent), then the teacher.
   - Settings → API: note the **Project URL** and the **anon/publishable key**. Keep the **service_role key** private; never paste it anywhere.
3. **Anthropic API**: create an account in the Claude Console, add a few dollars of credit, set a low monthly spend limit, create an API key. It will be stored as a Supabase secret in Phase 2, never in the frontend.
4. **Vercel** (free Hobby plan): sign up with your GitHub account. Deployment happens in Phase 4.

Send me the Project URL and the anon key when you have them (those two are safe to share; do not send the service_role key or the Anthropic key).
