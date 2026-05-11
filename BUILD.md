# Roéma Ops System — Build Plan

Detailed step-by-step build plan. Read [PLAN.md](./PLAN.md) first for context, features, and tech stack.

---

## Timeline at a glance

| Phase | What | Duration |
|---|---|---|
| 0 | Prerequisites & prep | 2–3 days (start NOW, in parallel with team feedback) |
| 1 | MVP scaffold (UI + database + local dev) | 3–5 days |
| 2 | Auth + deploy to Cloud Run | 2–3 days |
| 3 | Google Workspace integrations (Drive, Calendar, Gmail) | 1–2 weeks |
| 4 | Airwallex payment integration | 3–5 days |
| 5 | Data migration from bride decks | 3–5 days |
| 6 | Polish, test, team onboarding, launch | 3–5 days |
| v2 | _WhatsApp two-way messaging — deferred. See PLAN.md "Deferred" section._ | _(later)_ |

**Realistic total:** ~3–6 weeks of focused work (was 4–8 weeks before deferring WA). MVP usable internally by **end of week 2**.

---

## Phase 0 — Prerequisites (do these THIS WEEK in parallel with team feedback)

These are the slow-to-approve / blocking items. Start them before code.

### Accounts to create

- [x] **Google Cloud account** — done (project: `roema-atelier-ops-system`)
- [ ] **Airwallex sandbox** — sign up at https://www.airwallex.com/ (developer sandbox is free; production access requires KYC)
- [ ] **Domain decision** — confirm subdomain (e.g. `ops.roemaatelier.com`)
- ~~WhatsApp Business API~~ — **deferred to v2** (see PLAN.md)

### Decisions to lock with team

- [ ] Should designers see other designers' brides, or only their own?
- [ ] Should brides see the design conversation in real time, or only approved messages?
- [ ] Who can view the Books (financials) tab? Admin-only? Admin + bookkeeper?
- [ ] Approve final feature list after team feedback

### One-time data prep (you do this)

- [ ] Save all 30 bride decks into a single Google Drive folder
- [ ] Name them consistently: `[Bride First Name Last Name] - [Wedding Month Year].pdf`
- [ ] Add Putri Rahayu (and any other designers) to your team list

---

## Phase 1 — MVP scaffold (3–5 days)

**Goal:** A working Next.js app on your laptop, with the wireframe ported to real React components and a real database.

### Day 1 — Project setup

- [ ] Install Node.js (LTS version) from https://nodejs.org
- [ ] Install [Cursor](https://cursor.sh) or VS Code as the code editor
- [ ] Inside the `roema-atelier-ops-system` folder, scaffold the Next.js app:
  ```
  npx create-next-app@latest web --typescript --tailwind --app --eslint
  ```
  → All prompts: TypeScript Yes, ESLint Yes, Tailwind Yes, App Router Yes
- [ ] Move into `web/` folder and start the dev server: `npm run dev`
- [ ] Confirm you can see the Next.js welcome page at http://localhost:3000

### Day 2–3 — Database schema + Cloud SQL

- [ ] Spin up Cloud SQL (Postgres) in GCP console
  - Use minimal instance: `db-f1-micro` (~$10/mo)
  - Allow connections from your IP for local dev
- [ ] Install **Prisma** ORM in the Next.js project: `npm install prisma @prisma/client`
- [ ] Define schema in `prisma/schema.prisma` covering:
  - `User` (team members, with role: ADMIN / DESIGNER / BRIDE)
  - `Bride` (name, stage, designer, wedding_date, location, brief, KYC, etc.)
  - `Designer` (name, email, rate_per_hour)
  - `Payment` (bride, amount, currency, status, paid_at, airwallex_id)
  - `Milestone` (bride, label, date, done, current, overdue)
  - `DesignNote` (bride, author, message, attachments, created_at)
  - `Prospect` (name, phone, location, wedding_date, budget, message, status)
  - `Logistics` (bride, item, courier, tracking_number, status, eta)
  - `ActivityEvent` (type, message, related_to, created_at)
  - `Referral` (bride, source, notes)
  - `Measurement` (bride, fields like bust/waist/hips/etc.)
- [ ] Run `npx prisma migrate dev` to create the tables
- [ ] Seed with 3 example brides (from the wireframe) for dev

### Day 4–5 — Port wireframe to React components

- [ ] Create app structure (`/app/(admin)/`, `/app/(designer)/`, `/app/(bride)/`)
- [ ] Port each wireframe section into a React component:
  - `<Dashboard>` (pipeline funnel, calendar, revenue, payment aging, activity feed, comms, logistics, team travel)
  - `<ProspectsList>`
  - `<BridesList>`, `<BrideDetail>` (with tabs: Brief / Timeline / Design / Payments / Notes)
  - `<Books>`, `<TeamSettings>`
  - `<DesignerHome>`
  - `<BridePortal>` (Timeline / Design board / Payments)
- [ ] Replace the hardcoded data with database queries via Prisma
- [ ] Add CRUD forms (add bride, add prospect, update payment, add design note, etc.)

**End-of-phase deliverable:** Working app on `localhost:3000` showing real data from Postgres. No login yet, no integrations yet.

---

## Phase 2 — Auth + deploy (2–3 days)

### Day 1 — Sign in with Google

- [ ] Install [NextAuth.js](https://next-auth.js.org): `npm install next-auth`
- [ ] In GCP Console → APIs & Services → Credentials, create OAuth 2.0 Client ID
- [ ] Configure NextAuth with Google provider
- [ ] Restrict logins to your Workspace domain (`@roemaatelier.com`) for team
- [ ] Add role-based access middleware (admin/designer/bride routing)

### Day 2 — Deploy to Cloud Run

- [ ] Create a `Dockerfile` for the Next.js app
- [ ] Set up Cloud Build to auto-deploy on `git push` to `main`
- [ ] Connect your Cloud SQL instance to Cloud Run
- [ ] Add environment variables (DATABASE_URL, NEXTAUTH_SECRET, OAuth creds)
- [ ] Verify the deployed app works at the Cloud Run URL

### Day 3 — Custom domain

- [ ] Point `ops.roemaatelier.com` to Cloud Run via Cloud Run domain mapping
- [ ] Configure DNS in your domain registrar
- [ ] SSL certificate auto-provisions (Google-managed)

**End-of-phase deliverable:** Live at `https://ops.roemaatelier.com` with Google login. Internally usable by your team.

---

## Phase 3 — Google Workspace integrations (1–2 weeks)

Build these in any order based on what your team prioritizes.

### Google Drive integration (file uploads)

- [ ] Enable Drive API in GCP Console
- [ ] Add `drive.file` scope to OAuth
- [ ] In the bride detail view, add "Upload files" + "Link existing Drive file" actions
- [ ] Store the Drive file ID + URL in the database, not the file itself
- [ ] Display embedded preview / link out to Drive

### Google Calendar integration (fittings & milestones)

- [ ] Enable Calendar API in GCP Console
- [ ] Add `calendar.events` scope
- [ ] When a milestone is added/edited, create/update a Calendar event on the assigned team member's calendar
- [ ] Two-way sync: changes in Calendar reflect back in the system

### Gmail integration (notifications)

- [ ] Enable Gmail API in GCP Console
- [ ] Add `gmail.send` scope
- [ ] Replace the auto-notification rules (payment reminders, overdue alerts) with Gmail API sends
- [ ] Emails come from real `@roemaatelier.com` addresses

**End-of-phase deliverable:** Team can upload bride photos to Drive from inside the system, fittings appear in everyone's Google Calendar, and automated emails come from real Roéma addresses.

---

## Phase 4 — Airwallex payment integration (3–5 days)

- [ ] Generate API key in Airwallex sandbox dashboard
- [ ] Build a Payment Links service in the Next.js API routes
- [ ] On the bride detail page, add a "Send payment link" button for each milestone
  - Generates a branded Airwallex payment link
  - Emails the link to the bride
- [ ] Set up webhook endpoint to receive payment confirmations
- [ ] On webhook receipt, auto-update Payment status to "Collected"
- [ ] Test with sandbox transactions
- [ ] When ready, complete Airwallex KYC for production access

**End-of-phase deliverable:** Payments flow end-to-end in sandbox. Production launch pending Airwallex KYC.

---

## Phase 5 — Data migration (3–5 days)

- [ ] You: save all 30 bride decks in one Drive folder (named consistently)
- [ ] I (Claude) run an extraction script:
  - Reads each deck (PDF or slides)
  - Extracts structured fields: name, wedding date, location, designer, brief, budget, milestones, payment status
  - Outputs a CSV
- [ ] You spot-check ~5 randomly for accuracy
- [ ] Import CSV directly into the live database
- [ ] Link each bride's profile back to their original deck in Drive

**End-of-phase deliverable:** All 30 active brides live in the system, with original decks linked.

---

## Phase 6 — Polish, test, launch (3–5 days)

- [ ] Internal QA: walk through every workflow as if you were each role (admin, designer, bride)
- [ ] Edge cases: what if a bride has no designer assigned? What if a payment fails?
- [ ] Onboard Putri and any other designers (walk them through the designer portal)
- [ ] Send invitation links to 3–5 brides to try the bride portal — collect feedback
- [ ] Fix bugs from feedback
- [ ] Soft-launch: transition real ops in fully
- [ ] Document the system for new team members

---

## How we work together during the build

**You:**
- Make decisions (features, design, edge cases)
- Sign up for accounts and complete KYC
- Test the system as it's built
- Give feedback after each phase

**Claude (me):**
- Write the actual code
- Walk you through every command you need to run
- Debug when things break
- Iterate based on your feedback

**Workflow per phase:**
1. We talk about what we're building this phase
2. I write the code
3. You pull the changes and test locally
4. We iterate until it works
5. Commit + deploy
6. Move to next phase

---

## What to do NEXT to start fast

1. [x] **Sign up for Google Cloud + claim $300 free credit** — done
2. [ ] **Sign up for Airwallex sandbox:** https://www.airwallex.com/ (fast, ~10 min)
3. [ ] **Confirm your team has Workspace accounts** under `@roemaatelier.com`
4. [ ] **Save the 30 bride decks into one Drive folder** when convenient (used in Phase 5)
5. [ ] **Round 2 of team feedback** on the iterated wireframe

~~Twilio WhatsApp signup~~ — **skipped** (deferred to v2)

When 1–3 are done, come back and we'll start **Phase 1: MVP scaffold**.

---

*Last updated: 2026-05-11 — WhatsApp phase removed; Google Cloud signup done.*
