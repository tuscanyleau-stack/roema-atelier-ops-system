# Roéma Atelier — Ops System Plan

A record of decisions and the roadmap for the Roéma Atelier internal CRM / ops system. Update this file as decisions evolve.

---

## Context

- **Business:** Roéma Atelier — bespoke bridal couture house
- **Scale:** ~30 active brides at any given time
- **Geography:** Singapore, Hong Kong, London, Bali, Jakarta (international, multi-currency)
- **Current ops:** WhatsApp + Google Workspace + manual coordination across Roéma admin, designers (e.g. Putri Rahayu), and brides
- **Pain point:** Coordination across 30 brides × multi-stage timelines × international team is unmanageable manually

---

## What we're building

A **three-portal web app** with role-based access:

1. **Roéma admin portal** — master view (dashboard, pipeline, books, team mgmt, all brides)
2. **Designer portal** — designer-specific view of assigned brides and tasks
3. **Bride portal** — branded, white-labeled bride-facing experience (timeline, design board, payments)

Plus automated workflows: WhatsApp intake, payment reminders, overdue alerts, communication-gap detection, logistics tracking.

---

## Confirmed feature set

### Core (from wireframe v2)

- Pipeline funnel (Prospects → Brief → Production → Fitting → Delivered)
- Bride profiles (brief, timeline, design conversation, payments, KYC, internal notes)
- Activity feed with auto-tagged events
- Calendar view with milestone tracking
- Payment aging + collections tracking
- Communication gap detection (5+ days no contact → flag)
- Logistics tracking (courier + tracking number per shipment)
- Auto-notification rules (payment reminders, overdue alerts, etc.)
- Prospects auto-capture from WhatsApp Business
- Team & settings (member roles, invite flow)

### New features to add

| Feature | Notes |
|---|---|
| 📸 **Photo / file uploads per bride** | Sketches, mood boards, fabric swatches, fitting photos. Links to Google Drive (no duplication) |
| 📏 **Measurements module** | Structured form replacing PDF measurement sheets |
| 💳 **Payment links** | **Airwallex integration** — branded payment links, multi-currency, auto-mark "Collected" via webhook |
| 📅 **Google Calendar sync** | Push fittings/milestones into team members' existing calendars |
| 📨 **WhatsApp two-way messaging** | Reply to brides from inside the ops system. Full message history logged per bride. Auto-tag who replied |
| 🤝 **Referral tracking** | Where did each bride come from? (Past bride / IG / trunk show / etc.) for marketing ROI |
| 📊 **Designer P&L** | Hours per gown × designer rate → real margin per project |

### Explicitly deferred

- ❌ Contract / e-signature (not needed)
- ❌ Trunk show event manager (not needed yet)
- ❌ Multi-currency native support (not needed yet — Airwallex handles FX at the payment level)

---

## Tech stack

Chosen to integrate deeply with Roéma's existing Google Workspace.

| Layer | Tool | Reason |
|---|---|---|
| Framework | **Next.js (TypeScript, App Router)** | Modern React framework, good DX, easy to host |
| Hosting | **Google Cloud Run** | Pay-per-use, scales to zero, unified billing with Workspace |
| Database | **Cloud SQL (Postgres)** | Relational data (brides → payments → milestones); on GCP for unified billing |
| File storage | **Google Drive API** | Photos & decks stay in existing Drive folders — system references them, doesn't duplicate |
| Auth | **Sign in with Google (OAuth)** | Team already has Workspace accounts; one-click login |
| Email | **Gmail API** | Send from real `@roemaatelier.com` addresses |
| Calendar | **Google Calendar API** | Fittings appear in team's existing calendars |
| Payments | **Airwallex** | Multi-currency native, payment links, FX handling |
| Messaging | **WhatsApp Business API** (via Twilio or 360dialog) | Two-way WA inside the ops system |

**Estimated monthly cost at current scale:** ~$20–40/mo on GCP + Airwallex/Twilio per-transaction fees.

---

## Data migration plan

30 active brides' data currently lives in **individual decks in Google Drive** (no master spreadsheet).

Plan:

1. Save all 30 bride decks into a single Google Drive folder
2. Use Claude to read each deck and extract structured fields (name, wedding date, location, designer, brief, budget, payment status, milestones)
3. Output as a clean spreadsheet for review
4. Spot-check accuracy
5. Import directly into the live database
6. Link original decks back to each bride's profile in the system

Saves ~5–10 hours of manual data entry.

---

## Roadmap

| Phase | What | Status |
|---|---|---|
| 1 | Wireframe v2 (HTML prototype) | ✅ Done — live at https://tuscanyleau-stack.github.io/roema-atelier-ops-system/ |
| 2 | Team feedback on wireframe → iterate | 🔄 In progress |
| 3 | Lock feature set + add new features to wireframe | ⏳ Pending feedback |
| 4 | Build Next.js app on GCP stack | ⏳ |
| 5 | Integrations: Airwallex, WhatsApp, Google APIs | ⏳ |
| 6 | AI-assisted data import from 30 bride decks | ⏳ |
| 7 | Team onboarding & launch | ⏳ |

**Estimated time to launch:** 4–8 weeks of focused build work after wireframe is locked.

---

## Open items

- [ ] Collect team feedback on wireframe v2
- [ ] Sign up for Airwallex developer sandbox (free)
- [ ] Sign up for WhatsApp Business API access (via Twilio or 360dialog)
- [ ] Decide on a domain (use `roemaatelier.com` subdomain? e.g. `ops.roemaatelier.com`)
- [ ] Decide on team roles & permissions structure (admin / designer / bride / viewer?)
- [ ] Confirm: should designers see other designers' brides, or only their own?

---

## Repo layout (current + planned)

```
roema-atelier-ops-system/
├── index.html                  # Live wireframe (GitHub Pages)
├── roema_crm_v2_full.html      # Original wireframe export (reference)
├── PLAN.md                     # This file
└── (future)
    ├── apps/web/               # Next.js app
    ├── apps/api/               # Backend (if separated)
    └── packages/               # Shared types, utils
```

---

*Last updated: 2026-05-11*
