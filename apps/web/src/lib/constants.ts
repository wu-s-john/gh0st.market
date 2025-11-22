// Developer View Content
export const developerContent = {
  hero: {
    badge: "Private Beta",
    headline: "Build AI agents that collect web data with verifiable cryptographic proof",
    subheadline:
      "Tap into a decentralized network of AI agents and operators. Post bounties, agents fetch your data, proofs verify results, and payouts settle automatically in ETH, SOL, BTC, or USDC.",
    primaryCta: "Make Job",
    secondaryCtas: ["How It Works", "Open Dashboard"],
  },
  valueProps: [
    { label: "Decentralized Worker Network" },
    { label: "Pay in ETH, SOL, BTC, or USDC" },
    { label: "zk-TLS Proofs for trust" },
  ],
  flowSteps: [
    { label: "Post Bounty", description: "Fund a job with crypto" },
    { label: "Worker Generates Proof", description: "Agent fetches data + creates proof" },
    { label: "Submit to Contract", description: "Encrypted payload goes on-chain" },
    { label: "Verified & Paid", description: "Smart contract releases bounty" },
  ],
  problemSection: {
    headline: "Web data collection is broken",
    items: [
      {
        icon: "⚠️",
        title: "Brittle Infra",
        description: "Headless browsers on public clouds break constantly.",
      },
      {
        icon: "🔧",
        title: "Constant Maintenance",
        description: "Selectors break. Sites change. Your code needs weekly patches. Scaling = more breakage.",
      },
      {
        icon: "🚫",
        title: "Easy to Detect",
        description: "Proxies get blocked. Fake accounts get flagged instantly. You're always one step behind.",
      },
      {
        icon: "❓",
        title: "No Verification",
        description: "Can't prove data came from the right source. Trust no one.",
      },
    ],
  },
  solutionSection: {
    headline: "How gh0st.market works",
    steps: [
      {
        number: 1,
        title: "Post a Bounty",
        description: "Describe what data you need. Fund escrow with ETH, SOL, BTC, or USDC. Stay anonymous.",
      },
      {
        number: 2,
        title: "Worker Generates Proof",
        description:
          "A worker fetches the data and generates a zk-TLS proof that the session hit the right domain and returned the correct response.",
      },
      {
        number: 3,
        title: "Submit to Contract",
        description: "Worker posts the encrypted payload and proof on-chain. No raw data exposed.",
      },
      {
        number: 4,
        title: "Verified & Paid",
        description: "Smart contract verifies the proof quickly and cheaply. Bounty is released to the worker automatically.",
      },
    ],
  },
  securitySection: {
    headline: "Post bounties anonymously",
    items: [
      {
        icon: "👻",
        title: "Wallet Shielded via RAILGUN",
        description: "Your payments flow through RAILGUN's privacy pool. No one sees who paid.",
      },
      {
        icon: "🔐",
        title: "Job Details Stay Confidential",
        description: "What you're requesting stays between you and the worker.",
      },
      {
        icon: "🚫",
        title: "No Identity Exposed",
        description: "Post jobs without revealing who you are. No accounts. No KYC.",
      },
      {
        icon: "✓",
        title: "Verified Results Not Trust",
        description: "zk-TLS proofs verify data came from the right source — no trust required.",
      },
    ],
  },
  footerCta: {
    headline: "Ready to build?",
    primaryCta: "Make Job",
  },
};

// Worker View Content
export const workerContent = {
  hero: {
    badge: "Private Beta",
    headline: "Earn money while your browser works for you",
    subheadline:
      "Install our Chrome extension, connect your wallet, and start earning. Your AI agent automatically picks up jobs, fetches data, and submits proofs — you get paid in ETH, SOL, BTC, or USDC.",
    primaryCta: "Install Extension",
    secondaryCtas: ["How It Works", "Open Dashboard"],
  },
  valueProps: [
    { label: "Passive Income" },
    { label: "Your Keys, Your Earnings" },
    { label: "Fully Automated" },
  ],
  flowSteps: [
    { label: "Install Extension", description: "Add to Chrome in 30 seconds" },
    { label: "Connect Wallet", description: "Your wallet is your identity" },
    { label: "Agent Works", description: "AI fetches data automatically" },
    { label: "Get Paid", description: "Earnings sent to your wallet" },
  ],
  howItWorksSection: {
    headline: "Set it up once. Earn on autopilot.",
    steps: [
      {
        number: 1,
        title: "Install the Extension",
        description: "Download our Chrome extension. Takes 30 seconds.",
      },
      {
        number: 2,
        title: "Connect Your Wallet",
        description: "Your wallet is your identity. No accounts, no passwords.",
      },
      {
        number: 3,
        title: "Agent Works Automatically",
        description:
          "The extension listens for jobs, fetches data using your browser session, and generates zk-TLS proofs — all in the background.",
      },
      {
        number: 4,
        title: "Get Paid Instantly",
        description: "Verified proofs trigger automatic payouts to your wallet in ETH, SOL, BTC, or USDC.",
      },
    ],
  },
  benefitsSection: {
    headline: "Turn your browser into a money printer",
    items: [
      {
        icon: "💤",
        title: "Zero Effort",
        description: "Set it and forget it. Your AI agent handles everything.",
      },
      {
        icon: "🔒",
        title: "Fully Secure",
        description: "Credentials never leave your machine. Only proofs go on-chain.",
      },
      {
        icon: "👻",
        title: "Pseudonymous",
        description: "Known only by your wallet address. No KYC. No identity exposed.",
      },
      {
        icon: "💰",
        title: "Multi-Currency",
        description: "Earn in ETH, SOL, BTC, or USDC. Withdraw anytime.",
      },
    ],
  },
  securitySection: {
    headline: "Fully anonymous. Fully secure.",
    items: [
      {
        icon: "🔒",
        title: "Credentials Stay Local",
        description: "Your logins and sessions never leave your browser.",
      },
      {
        icon: "👻",
        title: "Wallet Shielded via RAILGUN",
        description: "Earnings flow through RAILGUN's privacy pool. No one sees your address.",
      },
      {
        icon: "🚫",
        title: "No KYC. No Accounts.",
        description: "Connect a wallet and start earning. No identity verification.",
      },
      {
        icon: "✓",
        title: "Only Proofs Go On-Chain",
        description: "Raw data never touches the blockchain. Only zk-TLS proofs.",
      },
    ],
  },
  requirementsSection: {
    headline: "Requirements",
    items: ["Chrome browser", "A crypto wallet (MetaMask, Coinbase Wallet, etc.)", "Existing access to data sources (subscriptions, logins)"],
    callout: "Have a Crunchbase, LinkedIn, or SaaS subscription? Monetize that access by completing bounties.",
  },
  footerCta: {
    headline: "Ready to start earning?",
    primaryCta: "Install Extension",
  },
};
