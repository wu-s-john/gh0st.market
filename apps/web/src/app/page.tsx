"use client";

import { useState } from "react";
import {
  NavBar,
  HeroSection,
  GridSection,
  StepsSection,
  Requirements,
  FooterCTA,
} from "@/components/landing";
import { developerContent, workerContent } from "@/lib/constants";

type ViewMode = "Developer" | "Worker";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("Developer");

  const isDeveloper = viewMode === "Developer";
  const content = isDeveloper ? developerContent : workerContent;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <NavBar viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* Hero Section */}
      <HeroSection
        badge={content.hero.badge}
        headline={content.hero.headline}
        subheadline={content.hero.subheadline}
        primaryCta={content.hero.primaryCta}
        secondaryCtas={content.hero.secondaryCtas}
        valueProps={content.valueProps}
        flowSteps={content.flowSteps}
      />

      {isDeveloper ? (
        <>
          {/* Problem Section - Developer Only */}
          <GridSection
            headline={developerContent.problemSection.headline}
            items={developerContent.problemSection.items}
          />

          {/* Solution Section - Developer Only */}
          <StepsSection
            headline={developerContent.solutionSection.headline}
            steps={developerContent.solutionSection.steps}
          />

          {/* Security Section - Developer */}
          <GridSection
            headline={developerContent.securitySection.headline}
            items={developerContent.securitySection.items}
          />
        </>
      ) : (
        <>
          {/* How It Works Section - Worker Only */}
          <StepsSection
            headline={workerContent.howItWorksSection.headline}
            steps={workerContent.howItWorksSection.steps}
          />

          {/* Benefits Section - Worker Only */}
          <GridSection
            headline={workerContent.benefitsSection.headline}
            items={workerContent.benefitsSection.items}
          />

          {/* Security Section - Worker */}
          <GridSection
            headline={workerContent.securitySection.headline}
            items={workerContent.securitySection.items}
          />

          {/* Requirements Section - Worker Only */}
          <Requirements
            headline={workerContent.requirementsSection.headline}
            items={workerContent.requirementsSection.items}
            callout={workerContent.requirementsSection.callout}
          />
        </>
      )}

      {/* Footer CTA */}
      <FooterCTA
        headline={content.footerCta.headline}
        primaryCta={content.footerCta.primaryCta}
      />
    </main>
  );
}
