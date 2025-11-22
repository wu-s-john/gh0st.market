# UI/UX Notes

Reference document for gh0st.market frontend implementation decisions.

## Architecture

**Single App** — One unified application at `gh0st.market` where users can act as either a Requester or Worker (or both). No subdomains.

## Role Switcher

Header toggle/dropdown that allows users to switch between roles:

```
┌──────────────────────────────────────────────────────────────┐
│  gh0st.market           [Requester ▾]          [0x1a2b...3c] │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
                          ┌───────────┐
                          │ Requester │  ← current (highlighted)
                          │ Worker    │
                          └───────────┘
```

### Behavior

- Dropdown displays current role with visual indicator (accent color or checkmark)
- Clicking an option switches the dashboard view context
- URL optionally reflects mode: `/dashboard` vs `/dashboard?mode=worker`
- State persisted in `localStorage` so it remembers preference on refresh

## Dashboard Content by Role

| Requester Mode            | Worker Mode              |
|---------------------------|--------------------------|
| Post new job              | Browse available jobs    |
| My posted jobs            | My claimed jobs          |
| Job submissions received  | Submit proofs            |
| Release payments          | Earnings history         |

## Navigation Structure

```
Header
├── Logo (gh0st.market)
├── Role Switcher [Requester ▾ / Worker]
└── Wallet Connect [0x1a2b...3c]

Main Dashboard (content changes based on role)
├── Requester View
│   ├── Post Job (CTA)
│   ├── My Jobs (list with status)
│   └── Submissions (review & release payment)
│
└── Worker View
    ├── Browse Jobs (available jobs list)
    ├── My Claims (jobs in progress)
    └── Earnings (payment history)
```

## Role Context

Role is implicit based on action:
- User posts a job → acting as Requester
- User claims a job → acting as Worker
- Same wallet can do both — the toggle just filters the dashboard view
