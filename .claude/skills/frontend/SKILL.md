---
name: frontend
description: gh0st.market UI/UX design system - dark theme with spectral purple accent, JetBrains Mono + Outfit typography, minimal tables, and technical infrastructure aesthetic
---

# gh0st.market Frontend Design Skill

You are designing UI for **gh0st.market** — a privacy-first job network where AI agents and human operators fetch web data with zk-TLS proofs.

---

## 1. Brand & Aesthetic

### Identity
- **Name:** gh0st.market
- **Tagline:** A privacy-first job network where AI agents and operators fetch web data you're allowed to see, and prove it with zk-TLS.

### Vibe
- **Spectral infrastructure.** Technical, trustworthy, minimal.
- Think: Linear meets a terminal. Vercel meets a cipher.
- The "ghost" represents data that moves without leaving footprints — invisible, ephemeral, untraceable.

### Not This
- Hypey crypto (no rainbow gradients, no moon emojis)
- Consumer app (no rounded friendly shapes)
- Corporate enterprise (no blue/gray blandness)
- "Hacker movie" aesthetic (no green-on-black Matrix rain)

### Audience
- Builders of AI agents
- Infrastructure engineers
- Crypto developers
- Data teams

### Tone
- Confident, technical, concise
- "Infra product" not "growth hack"

---

## 2. Color System: Phantom (Dark + Spectral)

### Color Palette Overview

| Token | Hex | Swatch | Usage |
|-------|-----|--------|-------|
| `--background` | `#0a0a0f` | ⬛ | Base background, near-black with blue undertone |
| `--surface` | `#13131a` | ⬛ | Cards, panels, modals |
| `--surface-2` | `#1a1a24` | ⬛ | Elevated surfaces, dropdowns, hover states |
| `--border` | `#1f1f2e` | ⬛ | Subtle separation |
| `--border-hover` | `#2d2d3d` | ⬛ | Interactive border states |
| `--text-primary` | `#e4e4ed` | ⬜ | Headings, important content |
| `--text-secondary` | `#8b8b9b` | 🩶 | Body text, descriptions |
| `--text-muted` | `#5b5b6b` | 🩶 | Hints, placeholders, timestamps |
| `--accent` | `#a78bfa` | 🟣 | Primary actions, links, highlights |
| `--accent-hover` | `#b99cff` | 🟣 | Hover state for accent |
| `--accent-muted` | `#7c5fcf` | 🟣 | Darker accent for backgrounds, borders |
| `--accent-glow` | `rgba(167,139,250,0.4)` | 🟣 | Glow effect |
| `--success` | `#34d399` | 🟢 | Verified, completed, confirmed |
| `--warning` | `#fbbf24` | 🟡 | Pending, attention needed |
| `--error` | `#f87171` | 🔴 | Failed, rejected, error |
| `--info` | `#60a5fa` | 🔵 | Informational, neutral highlight |

```css
:root {
  /* Backgrounds */
  --background: #0a0a0f;      /* ⬛ Base background, near-black with blue undertone */
  --surface: #13131a;         /* ⬛ Cards, panels, modals */
  --surface-2: #1a1a24;       /* ⬛ Elevated surfaces, dropdowns, hover states */

  /* Borders */
  --border: #1f1f2e;          /* ⬛ Subtle separation */
  --border-hover: #2d2d3d;    /* ⬛ Interactive border states */

  /* Text */
  --text-primary: #e4e4ed;    /* ⬜ Headings, important content */
  --text-secondary: #8b8b9b;  /* 🩶 Body text, descriptions */
  --text-muted: #5b5b6b;      /* 🩶 Hints, placeholders, timestamps */

  /* Accent: Spectral Purple */
  --accent: #a78bfa;          /* 🟣 Primary actions, links, highlights */
  --accent-hover: #b99cff;    /* 🟣 Hover state for accent */
  --accent-muted: #7c5fcf;    /* 🟣 Darker accent for backgrounds, borders */
  --accent-glow: rgba(167, 139, 250, 0.4);  /* 🟣 Glow effect */

  /* Semantic Colors */
  --success: #34d399;         /* 🟢 Verified, completed, confirmed */
  --warning: #fbbf24;         /* 🟡 Pending, attention needed */
  --error: #f87171;           /* 🔴 Failed, rejected, error */
  --info: #60a5fa;            /* 🔵 Informational, neutral highlight */
}
```

### Usage Guidelines
- **Background** for page-level backgrounds
- **Surface** for cards, panels, modals, and contained elements
- **Surface-2** for nested elements, dropdowns, and hover states
- **Accent** sparingly — primary CTAs, active states, key data
- **Semantic colors** only for their intended purpose (don't use green for non-success states)

---

## 3. Typography

### Font Stack
```css
:root {
  --font-display: 'JetBrains Mono', monospace;  /* Headlines, emphasis */
  --font-body: 'Outfit', sans-serif;            /* Body text, UI labels */
  --font-mono: 'JetBrains Mono', monospace;     /* Code, addresses, data */
}
```

### Scale
```css
/* Headlines - JetBrains Mono */
.h1 { font-family: var(--font-display); font-size: 2.25rem; font-weight: 700; line-height: 1.2; }
.h2 { font-family: var(--font-display); font-size: 1.75rem; font-weight: 700; line-height: 1.25; }
.h3 { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; line-height: 1.3; }
.h4 { font-family: var(--font-display); font-size: 1rem; font-weight: 600; line-height: 1.4; }

/* Body - Outfit */
.body-lg { font-family: var(--font-body); font-size: 1.125rem; font-weight: 400; line-height: 1.6; }
.body { font-family: var(--font-body); font-size: 1rem; font-weight: 400; line-height: 1.5; }
.body-sm { font-family: var(--font-body); font-size: 0.875rem; font-weight: 400; line-height: 1.5; }
.caption { font-family: var(--font-body); font-size: 0.75rem; font-weight: 400; line-height: 1.4; }

/* Mono - JetBrains Mono */
.mono { font-family: var(--font-mono); font-size: 0.875rem; font-weight: 400; }
.mono-sm { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 400; }
```

### Font Loading
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;500;600&display=swap" rel="stylesheet">
```

### Typography Rules
- Headlines always in JetBrains Mono (creates technical credibility)
- Body text in Outfit (clean, modern, readable)
- All addresses, hashes, code, and numeric data in JetBrains Mono
- Never use Inter, Roboto, Arial, or system defaults
- Line height: 1.2-1.3 for headlines, 1.5-1.6 for body

---

## 4. Tables: Minimal Lines

### Structure
```
  Job ID       Source         Status      Bounty      Submitted
  ────────────────────────────────────────────────────────────────
  0x7f3a...    crunchbase     ● Active    0.50 USDC   2m ago
  0x2b1c...    linkedin       ◐ Pending   1.20 USDC   15m ago
  0x9c4d...    salesforce     ✓ Done      2.00 USDC   1h ago
```

### CSS Implementation
```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
}

.table td {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.875rem 1rem;
  border-bottom: none;  /* No row borders */
}

.table tr:hover {
  background: var(--surface-2);
}

/* Monospace cells for addresses/data */
.table td.mono {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text-primary);
}
```

### Table Guidelines
- Header row: uppercase, muted color, small font, letter-spacing
- Single border below header only
- No borders between rows
- Hover: subtle background shift to surface-2
- Addresses in monospace, truncated
- Align numbers and amounts to the right
- Status column uses filled circle indicators

---

## 5. Status Indicators: Filled Circles

### Status Types
```css
.status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
}

.status::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-active::before { background: var(--accent); }      /* 🟣 ● Active */
.status-pending::before { background: var(--warning); }    /* 🟡 ◐ Pending */
.status-completed::before { background: var(--success); }  /* 🟢 ✓ Completed */
.status-failed::before { background: var(--error); }       /* 🔴 ✗ Failed */
.status-unclaimed::before { background: var(--text-muted); } /* 🩶 ○ Unclaimed */
```

### Usage
```html
<span class="status status-active">Active</span>
<span class="status status-pending">Pending</span>
<span class="status status-completed">Verified</span>
<span class="status status-failed">Failed</span>
<span class="status status-unclaimed">Unclaimed</span>
```

### Status Text Mapping
| State | Circle | Color | Swatch | Text Options |
|-------|--------|-------|--------|--------------|
| Active/In Progress | ● | `--accent` #a78bfa | 🟣 | Active, In Progress, Running |
| Pending/Queued | ● | `--warning` #fbbf24 | 🟡 | Pending, Queued, Awaiting |
| Completed/Verified | ● | `--success` #34d399 | 🟢 | Done, Verified, Completed, Confirmed |
| Failed/Rejected | ● | `--error` #f87171 | 🔴 | Failed, Rejected, Error |
| Unclaimed/Idle | ● | `--text-muted` #5b5b6b | 🩶 | Unclaimed, Idle, Available |

---

## 6. Buttons: Solid with Spectral Glow

### Button Variants
```css
/* Primary - Solid accent 🟣 with glow on hover */
.btn-primary {
  background: var(--accent);  /* 🟣 */
  color: white;
  font-family: var(--font-body);
  font-weight: 500;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 20px var(--accent-glow);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Secondary - Outlined */
.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-weight: 500;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-secondary:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

/* Ghost - Text only */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-weight: 500;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-ghost:hover {
  color: var(--text-primary);
  background: var(--surface-2);
}
```

### Button Sizes
```css
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
.btn-md { padding: 0.625rem 1.25rem; font-size: 0.875rem; }  /* default */
.btn-lg { padding: 0.75rem 1.5rem; font-size: 1rem; }
```

### Button Guidelines
- Primary buttons: Use sparingly, only for main CTAs (Post Job, Submit, Claim)
- Secondary buttons: For alternative actions (Cancel, Back, Filter)
- Ghost buttons: For tertiary actions, navigation, inline actions
- The spectral glow should only appear on primary buttons
- Always include hover and active states

---

## 7. Cards & Panels

### Default Card (C1)
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem;
}

.card:hover {
  border-color: var(--border-hover);
}
```

### Featured/Glow Card (C3)
```css
.card-featured {
  background: var(--surface);  /* ⬛ */
  border: 1px solid var(--accent-muted);  /* 🟣 */
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 0 30px rgba(167, 139, 250, 0.1);  /* 🟣 glow */
}
```

### Card Guidelines
- Default cards: Use for most content containers
- Featured cards: Use for highlighted items, active jobs, selected states
- No drop shadows on default cards (flat aesthetic)
- Border radius: 8px consistently
- Padding: 1.25rem (20px) for comfortable spacing

---

## 8. Address Display

### Truncation Pattern
```typescript
function truncateAddress(address: string): string {
  if (address.startsWith('0zk')) {
    // RAILGUN address
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  // Standard ETH address
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
// 0x7f3a8b2c9d4e5f6a1b2c3d4e5f6a7b8c9d2b1c → 0x7f3a...2b1c
// 0zk8a2f3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e → 0zk8a2...d8e9
```

### Address Component
```html
<span class="address" title="0x7f3a8b2c9d4e5f6a1b2c3d4e5f6a7b8c9d2b1c">
  0x7f3a...2b1c
  <button class="copy-btn" aria-label="Copy address">
    <svg><!-- copy icon --></svg>
  </button>
</span>
```

```css
.address {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.address .copy-btn {
  opacity: 0;
  transition: opacity 150ms ease;
}

.address:hover .copy-btn {
  opacity: 1;
}

/* RAILGUN addresses - slightly different styling */
.address-railgun {
  color: var(--accent);  /* 🟣 */
}
```

### Tooltip on Hover
```css
.address[title] {
  position: relative;
  cursor: pointer;
}

.address[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 10;
}
```

---

## 9. Motion & Animation

### Principles
- Subtle and functional, never playful
- Enhance perceived performance
- Guide attention, don't distract

### Transitions
```css
:root {
  --transition-fast: 100ms ease;
  --transition-base: 150ms ease;
  --transition-slow: 300ms ease;
}

/* Apply to interactive elements */
.interactive {
  transition: all var(--transition-base);
}
```

### Page Transitions
```css
.page-enter {
  opacity: 0;
  transform: translateY(8px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all var(--transition-slow);
}
```

### Loading States
```css
/* Skeleton shimmer - NOT spinners */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface) 25%,
    var(--surface-2) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Success Feedback
```css
.success-pulse {
  animation: pulse 400ms ease-out;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 var(--accent-glow); }
  100% { box-shadow: 0 0 0 12px transparent; }
}
```

### Motion Guidelines
- Page transitions: 150-300ms fade + slight translate
- Hover states: 100-150ms
- Loading: skeleton shimmer, never spinners
- Success: brief pulse on accent color
- **Avoid:** bouncy animations, confetti, shake effects, anything "fun"

---

## 10. Spacing System

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### Spacing Guidelines
- Use consistent spacing scale
- Card padding: space-5 (20px)
- Section gaps: space-8 or space-10
- Inline element gaps: space-2 or space-3
- Form field gaps: space-4

---

## 11. Form Elements

### Input Fields
```css
.input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.625rem 0.875rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--text-primary);
  width: 100%;
  transition: border-color var(--transition-base);
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  outline: none;
  border-color: var(--accent);  /* 🟣 */
}

.input:disabled {
  background: var(--background);
  color: var(--text-muted);
  cursor: not-allowed;
}
```

### Labels
```css
.label {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  display: block;
}
```

---

## 12. Environment Variables

### Convention
**Never use the `NEXT_PUBLIC_` prefix for environment variables.** Instead:

1. Define variables without the prefix in `.env.local`:
   ```
   DYNAMIC_ENVIRONMENT_ID=your-id-here
   ```

2. Expose them to the client via `next.config.ts`:
   ```typescript
   const nextConfig: NextConfig = {
     env: {
       DYNAMIC_ENVIRONMENT_ID: process.env.DYNAMIC_ENVIRONMENT_ID,
     },
   };
   ```

3. Use them in code without the prefix:
   ```typescript
   process.env.DYNAMIC_ENVIRONMENT_ID
   ```

### Why
- Cleaner variable names
- Explicit control over what gets exposed to the client
- Consistent naming between server and client code

### Generated Config Files
For contract addresses and deployment info, use generated TypeScript files instead of environment variables:
- `src/lib/contracts.generated.ts` - Auto-generated by `just eth-deploy-local`
- Contains `JOB_REGISTRY_ADDRESS`, `DEPLOYMENT_BLOCK`, `CHAIN_ID`

---

## 13. Anti-Patterns: What to Avoid

### Typography
- Never use Inter, Roboto, Arial, or system-ui as primary fonts
- Don't mix more than 2 font families
- Avoid thin font weights (< 400) on dark backgrounds

### Color
- Don't use pure black (#000000) — always use near-black with undertones like ⬛ `#0a0a0f`
- Don't use pure white (#ffffff) — use off-white ⬜ `#e4e4ed`
- Avoid rainbow gradients, neon colors, or "crypto bro" palettes
- Don't overuse the accent color 🟣 — it should feel special

### Layout
- No generic card shadows (use flat + border instead)
- Don't center everything — left-align most content
- Avoid cluttered UIs — embrace whitespace
- No rounded corners > 12px (keep it sharp)

### Motion
- No bouncy/springy animations
- No confetti or celebration effects
- No loading spinners (use skeletons)
- No auto-playing videos or animations

### Content
- Don't over-explain — users are technical
- No marketing fluff in the UI
- Avoid emojis in functional UI (okay in toasts/notifications sparingly)
- Never use "scrape", "scraper", "harvest" — use "data access", "collection"

### Crypto-specific
- Don't make it look like a "DeFi dashboard" with gradients everywhere
- Avoid generic blockchain iconography (chains, blocks)
- No countdown timers or urgency tactics
- Don't show raw wei values — always format to human-readable

---

## 14. Component Checklist

When building a new component, verify:

- [ ] Uses correct font family (display vs body vs mono)
- [ ] Colors come from design tokens, not hardcoded
- [ ] Hover/focus/active states defined
- [ ] Works on dark background
- [ ] Addresses are truncated and monospace
- [ ] Loading state uses skeleton, not spinner
- [ ] Spacing uses scale values
- [ ] Border radius is 6-8px
- [ ] Transitions are 100-150ms
- [ ] No forbidden words (scrape, harvest, etc.)

---

## 15. Example: Job Card

```html
<div class="card">
  <div class="job-header">
    <span class="address">0x7f3a...2b1c</span>
    <span class="status status-active">Active</span>
  </div>

  <h3 class="job-title">Fetch organization profiles from Crunchbase</h3>

  <div class="job-meta">
    <span class="job-source">crunchbase.com</span>
    <span class="job-bounty">0.50 USDC</span>
    <span class="job-time">Posted 2m ago</span>
  </div>

  <div class="job-actions">
    <button class="btn-primary">Claim Job</button>
    <button class="btn-ghost">View Details</button>
  </div>
</div>
```

```css
.job-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.job-title {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

.job-meta {
  display: flex;
  gap: var(--space-4);
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: var(--space-5);
}

.job-bounty {
  font-family: var(--font-mono);
  color: var(--success);  /* 🟢 */
}

.job-actions {
  display: flex;
  gap: var(--space-3);
}
```

---

## 16. Quick Reference

| Element | Font | Size | Color | Swatch |
|---------|------|------|-------|--------|
| Page title | JetBrains Mono 700 | 2.25rem | `--text-primary` #e4e4ed | ⬜ |
| Section heading | JetBrains Mono 700 | 1.25rem | `--text-primary` #e4e4ed | ⬜ |
| Body text | Outfit 400 | 1rem | `--text-secondary` #8b8b9b | 🩶 |
| Small text | Outfit 400 | 0.875rem | `--text-secondary` #8b8b9b | 🩶 |
| Muted text | Outfit 400 | 0.75rem | `--text-muted` #5b5b6b | 🩶 |
| Addresses | JetBrains Mono 400 | 0.8125rem | `--text-primary` #e4e4ed | ⬜ |
| RAILGUN addresses | JetBrains Mono 400 | 0.8125rem | `--accent` #a78bfa | 🟣 |
| Table header | Outfit 500 | 0.75rem | `--text-muted` #5b5b6b | 🩶 |
| Button primary | Outfit 500 | 0.875rem | white on `--accent` #a78bfa | 🟣 |
| Button secondary | Outfit 500 | 0.875rem | `--text-secondary` #8b8b9b | 🩶 |
| Success text | Outfit 400 | — | `--success` #34d399 | 🟢 |
| Warning text | Outfit 400 | — | `--warning` #fbbf24 | 🟡 |
| Error text | Outfit 400 | — | `--error` #f87171 | 🔴 |
| Info text | Outfit 400 | — | `--info` #60a5fa | 🔵 |
