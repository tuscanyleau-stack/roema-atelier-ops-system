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

Plus automated workflows: payment reminders, overdue alerts, communication-gap detection, logistics tracking. (WhatsApp two-way deferred to v2 — see Deferred section.)

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
- Team & settings (member roles, invite flow)
- _(Prospects auto-capture from WhatsApp moved to v2 along with full WA integration)_

### New features to add

| Feature | Notes |
|---|---|
| 📸 **Photo / file uploads per bride** | Sketches, mood boards, fabric swatches, fitting photos. Links to Google Drive (no duplication) |
| 📏 **Measurements module** | Structured form replacing PDF measurement sheets |
| 💳 **Payment links** | **Airwallex integration** — branded payment links, multi-currency, auto-mark "Collected" via webhook |
| 📅 **Google Calendar sync** | Push fittings/milestones into team members' existing calendars |
| 🤝 **Referral tracking** | Where did each bride come from? (Past bride / IG / trunk show / etc.) for marketing ROI |
| 📊 **Designer P&L** | Hours per gown × designer rate → real margin per project |
| ⭐ **Bride tiers (RCL / Standard / Sponsored)** | RCL = Roéma Complete Lead (premium service); visible across all views |
| 💼 **Designer payout tracker** | Internal Roéma ↔ Designer payment flow with per-bride profit share % |
| 🗓️ **Monthly calendar views** | Designer & bride see milestones as a calendar (linear timeline still available as secondary) |

### Deferred to v2 (after launch)

- ⏸️ **WhatsApp two-way messaging** — Reviewed and deferred. Reasons: 2–4 week WhatsApp Business API approval, ~$30–100/mo ongoing cost, 24-hour message window rule, no group chat support, existing history doesn't migrate. Team will continue using WhatsApp normally on phones and manually log key items into the ops system. Revisit in 3–6 months once v1 is in use. If pain is real, evaluate off-the-shelf tools (Respond.io, Wati) before custom build.
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
| Messaging | _Deferred to v2 — see "Deferred" section above_ | |

**Estimated monthly cost at current scale:** ~$20–40/mo on GCP + Airwallex per-transaction fees.

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
| 1 | Wireframe v1 (HTML prototype) | ✅ Done — live at https://tuscanyleau-stack.github.io/roema-atelier-ops-system/ |
| 2 | Team feedback on wireframe → iterate | ✅ Done (rounds 1 + 2 incorporated; wireframe v1 locked 2026-05-11) |
| 3 | Lock feature set | ✅ Done (see Confirmed feature set above) |
| 4 | Build Next.js app on GCP stack | 🔄 **Starting now** |
| 5 | Integrations: Airwallex, Google APIs (Drive, Calendar, Gmail) | ⏳ |
| 6 | AI-assisted data import from 30 bride decks | ⏳ |
| 7 | Team onboarding & launch | ⏳ |
| v2 | WhatsApp two-way messaging (deferred — see above) | ⏸️ |

**Estimated time to launch:** 4–8 weeks of focused build work after wireframe is locked.

---

## Open items

- [x] Collect team feedback on wireframe v2 (round 1 done — incorporated)
- [ ] Collect team feedback on wireframe v2.1 (round 2 — pending)
- [ ] Sign up for Airwallex developer sandbox (free)
- [x] Decide on a domain — **`portal.roemaatelier.com`** (decided 2026-05-11)
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

*Last updated: 2026-05-11 — WhatsApp integration deferred to v2 after cost/complexity review.*
