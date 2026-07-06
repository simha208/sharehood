# ShareHood 🏘️

> Share items with your building neighbors — safely, easily, and for free.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**🔗 Live app:** [https://sharehood.vercel.app](https://sharehood.vercel.app)

---

## Overview

ShareHood is a community platform where apartment building neighbors can lend, borrow, and share everyday items — drills, tents, books, kitchen appliances — instead of buying things they only need once. Users post items, send borrow requests, chat with each other, and build a Karma trust score based on their reliability.

---

## What problem does it solve

People buy items they use once or twice, while their neighbors already own the exact same thing sitting unused. There's no easy way to discover what your building neighbors have to lend. WhatsApp groups are unorganized, Facebook Marketplace is for selling, and nothing is designed specifically for trusted, free sharing within a building. ShareHood fixes that.

---

## Target audience

Residents of apartment buildings and neighborhoods who want to:
- Avoid buying things they need for a one-time task (drilling a hole, camping trip, reading one book)
- Lend things they rarely use
- Build trust and community with their neighbors

Typical situation: "I need a drill to hang a picture. I don't want to buy one. Does any neighbor have one?"

---

## Competitors and differentiation

| Competitor | How ShareHood is different |
|---|---|
| **WhatsApp groups** | ShareHood has structured item listings, categories, borrow request tracking, and status updates — not just text posts in a group |
| **Facebook Marketplace** | ShareHood is free, building-scoped, and built for trust not commerce |
| **Nextdoor** | ShareHood focuses purely on item sharing with a complete request/approve/return flow |
| **Buying it yourself** | ShareHood saves you money and reduces waste — the item already exists nearby |
| **Just asking verbally** | ShareHood keeps a history, tracks returns, and rewards reliability with a Karma score |

---

## Demo accounts

| Email | Password | Description |
|---|---|---|
| `demo@sharehood.app` | `demo1234` | Main demo user with items and history |
| `neighbor@sharehood.app` | `demo1234` | Neighbor account for testing requests and chat |

> On the login screen, click **"Fill"** next to any demo account to auto-fill credentials.

---

## ERD — Data Model

![ShareHood ERD](./public/erd.svg)

### Tables

**users**
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, references auth.users |
| name | text | |
| email | text | unique |
| building | text | |
| karma | int | default 0 |
| created_at | timestamptz | |

**items**
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| owner_id | uuid | FK → users.id |
| title | text | |
| description | text | |
| category | text | Tools, Books, Sports, Home, Tech… |
| image_url | text | Supabase Storage URL |
| status | text | available \| borrowed \| reserved |
| created_at | timestamptz | |

**borrow_requests**
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| item_id | uuid | FK → items.id |
| borrower_id | uuid | FK → users.id |
| status | text | pending \| approved \| rejected \| returned |
| created_at | timestamptz | |

**messages**
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| sender_id | uuid | FK → users.id |
| receiver_id | uuid | FK → users.id |
| item_id | uuid | FK → items.id (nullable) |
| message | text | |
| created_at | timestamptz | |

---

## External services and integrations

| Service | Type | What it's used for |
|---|---|---|
| **Supabase Auth** | Authentication | Email/password login and session management; JWT tokens; route protection |
| **Supabase Database** | PostgreSQL database | Stores all app data: users, items, borrow requests, messages; Row Level Security (RLS) enforced |
| **Supabase Storage** | File storage | Stores item photos uploaded by users; public CDN bucket named "items" |
| **Vercel** | Hosting / deployment | Deploys the Next.js 15 frontend; serverless API routes; edge middleware |

---

## Features

- 🔐 **Auth** — Email/password registration and login via Supabase Auth
- 🔍 **Browse** — Dashboard with real-time category filters and search
- 📦 **Add items** — Upload photo from device, select category, write description
- 📬 **Borrow requests** — Request → Owner approves/rejects → Mark returned
- 💬 **Chat** — Direct messaging between neighbors, linked to items
- ⭐ **Karma system** — Points for returning on time (+10), successful lends (+5), karma levels (New / Good / Trusted / Legend)
- 🛡️ **Security** — Row Level Security on all database tables; route protection via Next.js middleware

---

## Running locally

```bash
git clone https://github.com/YOUR_USERNAME/sharehood
cd sharehood
npm install
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → paste contents of `supabase/schema.sql` → Run
3. Storage → New bucket → name: `items` → set to **Public**
4. Copy Project URL and anon key to `.env.local`

## Deploy to Vercel

1. Push to a public GitHub repo
2. [vercel.com](https://vercel.com) → Import project
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy ✅

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript |
| Styling | Custom CSS (no UI library) |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Hosting | Vercel |
| Database | PostgreSQL with RLS |
