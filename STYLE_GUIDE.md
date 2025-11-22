# Style Guide

Style guide for writing about the project. Share this with collaborators and wire it into your AI prompts so everything stays on‑message.

## 1. Positioning & Narrative

### One‑liner (default):

> A privacy‑first job network where AI agents and human operators fetch web data you're allowed to see, and prove it with zk‑TLS.

### Core story beats (always hit these):

**Web data is crucial.**
Products, analytics, and AI systems need structured data from SaaS dashboards, CRMs, B2B data providers, etc.

**Current automation is brittle and untrusted.**
Cloud browser fleets, proxies, and fake accounts are easy to detect, hard to maintain, and not verifiable.

**We use agents + proofs, not scrapers.**
Workers (and their AI agents) bring their own authorized access; the protocol just coordinates jobs and verifies results with zk‑TLS.

**Privacy by default.**
Requester intents and budgets can be kept confidential; workers remain pseudonymous; only minimal metadata and proofs hit the chain.

**Developer experience feels like normal APIs.**
To devs, it looks like posting jobs, getting JSON back, and maybe calling an SDK — not wrestling with wallets or browser infra.

## 2. Tone & Audience

**Audience:** builders of AI agents, infra engineers, crypto devs, data teams.

**Tone:** confident, technical, concise. Think "infra product", not hypey growth hack.

**Avoid:** edgy "scraping" / "bot farm" energy; anything that sounds like "we bypass ToS".

### Good tone snippets:

- "browser infrastructure for AI agents"
- "delegated data access layer"
- "verifiable web data connector"
- "authorized, session‑backed data collection"

## 3. Vocabulary: Preferred Terms vs. Avoid

### ✅ Use these

**For the activity:**
- web data access
- data collection jobs
- programmatic data collection
- browser automation / web automation
- session‑backed data fetching
- authorized data retrieval
- web data connectors
- AI agents that authenticate, navigate, and collect data from web applications

**For the actors:**
- requesters / data consumers
- workers / operators
- AI agents / browser agents
- data access jobs / tasks

**For the tech:**
- zk‑TLS proof / zero‑knowledge TLS
- smart contract escrow
- privacy‑preserving settlement
- serverless browser environment / headless browser cloud
- user‑permissioned integrations / user‑permissioned sessions

### 🚫 Avoid (externally)

- "scraping", "scrapers"
- "harvesting"
- "farm", "botnet"
- "bypass paywalls", "circumvent ToS"
- "fake accounts" / "sockpuppets"

If you really need to mention these (e.g. in a comparison), frame them as legacy approaches you replace:

> "Instead of brittle scraping scripts and proxy farms, we rely on authorized sessions plus zk‑TLS proofs."

## 4. How to Structure Docs / Pitches

When someone (human or AI) is writing about the project, default to this structure:

### Problem
- The world wants account‑gated web data.
- Existing automation is brittle and untrusted.
- There's no way to prove a given session did what it claimed.

### What we are
> "A confidential job network where AI agents and human operators with existing access fetch data on your behalf and prove the result with zk‑TLS."

### How it works
1. Requesters post data access jobs and fund escrow.
2. Agents (backed by real user sessions) authenticate, navigate, and collect the requested fields.
3. zk‑TLS proofs show the TLS handshake + HTTP request/response came from the right domain and endpoint.
4. Smart contracts verify proofs and release payment.

### Why it's safe & different
- Workers only use accounts they're already authorized to use.
- Credentials never leave the worker's environment.
- Proofs, not screenshots, enforce correctness.
- Privacy: job details and identities can be shielded.

### Developer experience
> "Post a job via SDK, wait for a webhook / callback with result + proof."

> "Feels like calling a web API, powered by AI agents and zero‑knowledge under the hood."

## 5. Copy "Patterns" to Reuse

You can give these as templates to AI agents or teammates and let them fill in the brackets.

### Tagline pattern
> "A privacy‑first job network where AI agents and operators fetch [type of web data] from [kind of apps] and prove correctness with zk‑TLS."

### Job explanation pattern
> "Requesters define a data access job (e.g. '[example job]').
> Authorized agents log in, navigate the target app, collect the requested fields, and return the result with a zk‑TLS proof that the session really hit [domain] / [endpoint]. A smart contract verifies the proof and pays out from escrow."

### Comparison pattern
> "Instead of running your own proxy fleet and brittle scraping scripts, you tap into a marketplace of authorized sessions and verifiable browser agents."

### Privacy pattern
> "The chain only sees commitments and proofs. Who requested the job, which account fetched it, and what the raw payload was can remain confidential."

## 6. Prompt Hint for AI Agents

When you ask another model to write about this project, prepend something like:

> "You're describing a privacy‑first job network for web data.
> Always emphasize: AI agents + human operators with legitimate access, zk‑TLS proofs, smart contract escrow, and a Web2‑simple UX.
> Never use the words 'scrape' or 'scraper'. Instead say 'web data access', 'browser automation', or 'data collection jobs'. Make it sound like Browserbase/Anon‑style AI agents that authenticate, navigate, and collect data from web applications, including those without APIs."
