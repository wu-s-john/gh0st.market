## Problem Statement

- Modern teams depend on rich, web‑native data — things like company profiles, funding histories, dashboards, and account‑gated SaaS UIs.
- Getting that data into products and pipelines is still painful:
  - Spinning up fleets of headless browsers on public clouds is brittle and easy to fingerprint.
  - Proxy networks are unreliable, noisy, and increasingly trivial for sites to detect or block.
  - Fake accounts and ad‑hoc "growth" tricks get flagged, create compliance risk, and don't scale.
- At the same time, this paywalled and account‑gated data is extremely valuable:
  - Investors, analysts, growth teams, and AI systems all want access to it in a structured, machine‑readable way.
- There is no standard, verifiable way for someone who already has legitimate access to securely fetch this data on your behalf and prove they did exactly what you asked.
- The result: developers fight brittle web automation instead of focusing on products, and organizations either give up on this data or rely on opaque third‑party scrapers they can't trust or audit.


## Solution

- We turn **AI‑powered browser agents and human operators** into a verifiable data access layer.
- Requesters anonymously post **data access jobs**:
  - e.g. "Fetch these 50 organization profiles from Crunchbase" or "Export this dashboard view from a SaaS tool."
  - Jobs specify the source domain, endpoint or view, and the fields they care about – not implementation details.
- Workers – or their AI agents – who already have valid access (subscriptions, logins, internal accounts) pick up jobs:
  - Their local agent authenticates, navigates the web application, and collects the requested fields, similar to how Anon‑style agents log in and extract data from web apps without first‑class APIs.
  - The agent runs inside a hardened, long‑lived browser environment, like the serverless browser infrastructure used by AI agents on platforms such as Browserbase.
- For each job, the worker's client:
  - Performs the HTTPS request or browser session.
  - Produces a **zk‑TLS proof** that the session really hit the specified domain and path and that the returned body matches the data they're submitting.
- A smart contract:
  - Verifies the zk‑TLS proof.
  - Uses on‑chain escrow (funded in USDC) to automatically pay the worker once the proof checks out.
- Throughout the flow:
  - **Requesters stay private** – job details and budgets can be kept confidential on a privacy L2.
  - **Workers stay pseudonymous** – they never reveal credentials, only proofs that their authorized session returned the right data.
  - To both sides, it feels like interacting with a simple web app and AI agents, not "doing crypto" or managing infrastructure.
