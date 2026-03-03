# RevSync Web

> **Status**: Scaffolding — Next.js app for marketplace, tuner uploads, admin, and support.

## Purpose

The web app is the **second platform** in RevSync's multi-platform strategy:

| Function | Details |
|----------|---------|
| Marketplace | Browse + purchase tunes (no BLE needed) |
| Tuner Dashboard | Upload tunes, view analytics, manage listings |
| Admin Panel | Moderation, user management, content review |
| Support Portal | Ticket system, knowledge base, FAQs |
| Account Management | Profile, purchases, subscriptions |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (user-specified) |
| Auth | Supabase Auth (shared with mobile) |
| API | Django REST backend (shared `/backend`) |
| Payments | Stripe |
| Deployment | Vercel |

## Folder Structure

```
web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx       # Landing page
│   │   ├── marketplace/   # Tune marketplace
│   │   ├── dashboard/     # User dashboard
│   │   ├── telemetry/     # Live telemetry view
│   │   ├── safety/        # Safety & trust page
│   │   └── pricing/       # Pricing tiers
│   ├── components/        # Shared React components
│   ├── lib/               # Utilities, API client, auth
│   └── styles/            # Global styles, design tokens
├── public/                # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

## Shared Resources

- **Backend API**: Same Django REST API at `/backend`
- **Auth**: Same Supabase project (shared user accounts)
- **Design System**: Same color tokens (`#ea103c`, `#1a1a1a`, `#252525`)
- **Typography**: Inter (Google Fonts)

## Getting Started

```bash
cd web
npm install
npm run dev
# → http://localhost:3000
```
