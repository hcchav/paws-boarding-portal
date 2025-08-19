# Demo Plan — Date Request → Slack Approval (Custom Dog Boarding System)

**Proposed Git repo name:** `paws-boarding-portal`

This plan is optimized for building the **first demo** (Date Request → Slack Approval with Google Calendar availability & VIP auto-approval). It’s structured so you can drop it into Windsurf and implement quickly.

---

## 1) Scope of the Demo
- Public **Date Request** page: parent/dog info + date range.
- **Rules enforced**:
  - Weeknights allowed (Mon–Thu).
  - Weekend package must be **Fri → Mon** (no Sat/Sun arrivals or departures).
- **Google Calendar** availability check against a dedicated “Boarding Availability” calendar.
- **VIP auto-approval** if calendar open.
- **Slack approval** (Approve / Deny buttons) if not VIP.
- **Outcome screens**: auto-approved success, pending (awaiting Slack), denied.

> Phase 2 (not in this demo): full branded booking form, pricing/add-ons, payment, drip emails, Asana sync.

---

## 2) Architecture Overview
- **Frontend**: Next.js (App Router) + Tailwind for a clean, branded feel.
- **Backend**: Next.js API routes.
- **Database**: Prisma + SQLite (local) or Supabase (Postgres) if you prefer hosted ASAP.
- **Integrations**:
  - Slack: interactive approval buttons via Block Kit.
  - Google Calendar: service account with calendar read permissions.
- **Hosting**: Vercel (easy env & previews) or your preference.

---

## 3) Directory Structure
```
paws-boarding-portal/
  ├─ app/
  │  ├─ request/page.tsx          # Date Request UI
  │  ├─ approved/page.tsx         # Success (auto or manual) placeholder
  │  ├─ denied/page.tsx           # Denied screen
  │  └─ pending/page.tsx          # Pending approval screen
  ├─ pages/api/
  │  ├─ request.ts                # POST: validate, check calendar, VIP, Slack post
  │  └─ slack/actions.ts          # POST: Slack interactivity (approve/deny)
  ├─ prisma/
  │  └─ schema.prisma
  ├─ src/
  │  ├─ lib/calendar.ts           # Google Calendar helper
  │  ├─ lib/slack.ts              # Slack post/update
  │  ├─ lib/rules.ts              # Booking rules (weeknight/weekend)
  │  └─ db.ts                     # Prisma client
  ├─ .env.example
  ├─ README.md
  └─ DEMO_PLAN.md                 # (this file)
```

---

## 4) Environment Variables
Create `.env.local` from the example:
```
DATABASE_URL=
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_CHANNEL_ID=
GOOGLE_PROJECT_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
"
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
APP_BASE_URL=http://localhost:3000
```

---

## 5) Data Model (Prisma)
```prisma
model Request {
  id         String   @id @default(cuid())
  createdAt  DateTime @default(now())
  parentName String
  dogName    String
  email      String
  startDate  DateTime
  endDate    DateTime
  isVip      Boolean  @default(false)
  status     RequestStatus @default(PENDING)
  slackTs    String?
}

enum RequestStatus {
  PENDING
  APPROVED
  DENIED
  AUTO_APPROVED
}

model VipDog {
  id      String @id @default(cuid())
  dogName String @unique
}
```

---

## 6) Booking Rules
```ts
// weekend package must be Fri->Mon (3 nights)
export function isValidWeekendPackage(start: Date, end: Date) {
  const FRI = 5, MON = 1;
  return start.getDay() === FRI && end.getDay() === MON && nightsBetween(start, end) === 3;
}

// weeknights allowed Mon–Thu
export function isValidWeeknight(start: Date, end: Date) {
  const s = start.getDay();
  const e = end.getDay();
  return s >= 1 && s <= 4 && e >= 1 && e <= 4 && end > start;
}

export function bookingRulesOk(start: Date, end: Date) {
  return isValidWeekendPackage(start, end) || isValidWeeknight(start, end);
}
```

Helper:
```ts
export function nightsBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
```

---

## 7) Google Calendar Helper
```ts
import { google } from 'googleapis';

export async function isRangeAvailable(startISO: string, endISO: string) {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar.readonly']
  );
  const calendar = google.calendar({ version: 'v3', auth });

  const { data } = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID!,
    timeMin: startISO,
    timeMax: endISO,
    singleEvents: true,
    orderBy: 'startTime'
  });

  return (data.items ?? []).length === 0;
}
```

---

## 8) Slack Approval Message (Block Kit)
```ts
import { WebClient } from '@slack/web-api';
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function postApprovalRequest(reqId: string, info: {
  parentName: string; dogName: string; startText: string; endText: string;
}) {
  const res = await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID!,
    text: `Boarding request for ${info.dogName}`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text:
        `*New Boarding Request*\n*Parent:* ${info.parentName}\n*Dog:* ${info.dogName}\n*Dates:* ${info.startText} → ${info.endText}`
      }},
      { type: 'actions', elements: [
        { type: 'button', text: { type: 'plain_text', text: '✅ Approve' }, style: 'primary',
          value: JSON.stringify({ reqId, action: 'approve' }), action_id: 'approve_request' },
        { type: 'button', text: { type: 'plain_text', text: '❌ Deny' }, style: 'danger',
          value: JSON.stringify({ reqId, action: 'deny' }), action_id: 'deny_request' }
      ]}
    ]
  });
  return res.ts as string;
}
```

---

## 9) API Endpoints (Behavior)
### `POST /api/request`
1) Validate dates against **booking rules**.  
2) **Check availability** with Calendar.  
3) **Lookup VIP** (by dog name).  
4) Create DB record.  
5) If VIP → mark `AUTO_APPROVED` and redirect to `/approved?req=<id>`  
6) Else → post Slack message; return `/pending?req=<id>`

### `POST /api/slack/actions`
- Verify Slack signature (raw body required).
- Parse button click → update DB `APPROVED` or `DENIED`.
- Optionally update Slack message to show outcome.
- Redirect parent to `/approved` or `/denied` via email link (out of scope for demo).

---

## 10) UI Pages
- `/request` – Simple, branded form (Parent Name, Dog Name, Email, Start Date, End Date)
- `/approved` – “You’re all set! Next step coming soon.”
- `/pending` – “Thanks! We’ll confirm shortly.”
- `/denied` – “Sorry, those dates aren’t available.”

---

## 11) Implementation Steps (Checklist)
**Day 1**
- [ ] Init repo, Next.js, Tailwind, Prisma.
- [ ] Add Prisma schema; run migration; seed 1–2 VIP dogs.
- [ ] Build `/request` page UI.
- [ ] Implement booking rules helper.

**Day 2**
- [ ] Google service account + calendar share; add “Blocked” sample events.
- [ ] Implement calendar helper & availability check.
- [ ] Implement `POST /api/request` flow (VIP auto-approve + Slack pending).

**Day 3**
- [ ] Create Slack app; set scopes; enable interactivity; point to `/api/slack/actions`.
- [ ] Implement Slack message + interactivity handler.
- [ ] Build `/approved`, `/pending`, `/denied` pages.

**Day 4**
- [ ] Wire env vars; test 3 scenarios (VIP/open, non‑VIP/open, blocked).
- [ ] Polish UI (brand colors, playful copy).
- [ ] Record a 60–90s demo walkthrough.

---

## 12) Test Scenarios
1. **VIP + open** → instant auto-approve → `/approved`.
2. **Non‑VIP + open** → Slack message → Approve → `/approved`.
3. **Any + blocked** → inline “dates unavailable” message.
4. **Slack Deny** → `/denied`.

---

## 13) Demo Script (Live Walkthrough)
1) Fill Date Request with a **VIP dog** → instant approval.  
2) Fill Date Request with **non‑VIP** → show Slack approval → click Approve → show Approved page.  
3) Attempt dates during **blocked** period → show polite unavailable copy.

---

## 14) Phase 2 Outline (for later)
- Full branded booking form with **pricing & add-ons** (Stripe Checkout).
- Email drip using Resend (T‑7, T‑3, T‑1 with packing tips).
- Asana task creation on approval.
- Admin dashboard for requests & VIP list management.

---

## 15) Commands
```bash
# Create app
npx create-next-app@latest paws-boarding-portal --typescript --eslint
cd paws-boarding-portal

# Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Prisma & Client
npm install prisma @prisma/client
npx prisma init

# Slack & Google
npm install @slack/web-api @googleapis/calendar

# (Optional) email + zod + date utils
npm install zod date-fns
```

---

## 16) Notes for Windsurf
- Add **Tasks** in Windsurf:
  - “Implement booking rules helper”
  - “Calendar availability check”
  - “Slack approval block”
  - “Interactivity signature verification”
- Use Windsurf’s **agent to scaffold** pages & API routes quickly, then refine.
- Keep commits small and labeled with the step (e.g., `feat(api): add /api/request core flow`).

---

## 17) Milestones (Client-Facing)
1. **M1 – Request & Approval Demo** (this deliverable)
2. **M2 – Branded Booking + Pricing**
3. **M3 – Payments + Drip Emails**
4. **M4 – Asana + Admin Dashboard**
