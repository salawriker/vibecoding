# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The imported `AGENTS.md` above is not boilerplate: this repo runs **Next.js 16** (see `package.json`), whose App Router APIs and conventions diverge from older Next.js. Before writing framework code, read the relevant guide under `node_modules/next/dist/docs/`.

## What this is

A lead-capture web app. A single public page presents a form collecting **name, email, and phone**, intended to persist leads to Supabase via Drizzle ORM.

**Current state:** the form is fully wired. [src/app/page.tsx](src/app/page.tsx) (client) submits via a `<form action>` bound to the `createLead` Server Action in [src/app/actions.ts](src/app/actions.ts), which validates and inserts into the `leads` table with Drizzle. Validation logic is shared between client (instant feedback) and server (authoritative) via [src/lib/validation.ts](src/lib/validation.ts). The form uses progressive enhancement — it still submits without client JS, and client validation gates via `onSubmit` + `preventDefault`.

## Commands

```bash
npm run dev          # dev server at http://localhost:3000
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint

npm run db:generate  # generate SQL migration from schema changes
npm run db:migrate   # apply migrations
npm run db:push      # push schema directly to DB (skips migration files)
npm run db:studio    # Drizzle Studio (DB browser)
```

No test framework is configured yet.

## Architecture

The data layer is intentionally split across two clients, each for a different job — do not consolidate them without reason:

- **[src/db/](src/db/)** — server-side Postgres access via Drizzle over the `postgres` driver. [src/db/schema.ts](src/db/schema.ts) is the source of truth for tables (`leads`); [src/db/index.ts](src/db/index.ts) exports the `db` client. Use this for reads/writes from server code (Server Actions / route handlers). Connection uses `prepare: false` because it targets Supabase's connection pooler.
- **[src/lib/supabase.ts](src/lib/supabase.ts)** — the `@supabase/supabase-js` client, for Supabase-specific features (auth, storage, realtime). Uses the public anon key.

Both throw at import time if their env vars are missing, so importing them into a client component or a page rendered without env config will crash that route. This is why the form page currently imports neither.

- **[drizzle.config.ts](drizzle.config.ts)** points Drizzle Kit at `src/db/schema.ts`, emitting migrations to `./drizzle/`.

## Environment

Copy [.env.example](.env.example) to `.env.local` and fill in Supabase values:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase Dashboard → API
- `DATABASE_URL` — Postgres connection string; use the **pooler** address (matches `prepare: false` in the db client)

## Conventions

- App Router with `src/` dir and the `@/*` import alias (→ `src/`).
- User-facing copy is in Korean.
