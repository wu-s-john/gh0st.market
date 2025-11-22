"use client";

import { Badge, Button } from "@/components/ui";
import { FlowDiagram } from "./FlowDiagram";
import { ValueProps } from "./ValueProps";

interface HeroSectionProps {
  badge: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCtas: string[];
  valueProps: { label: string }[];
  flowSteps: { label: string; description: string }[];
}

export function HeroSection({
  badge,
  headline,
  subheadline,
  primaryCta,
  secondaryCtas,
  valueProps,
  flowSteps,
}: HeroSectionProps) {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="mb-6">
          <Badge variant="accent">{badge}</Badge>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-4xl md:text-5xl font-bold text-[var(--text-primary)] leading-tight mb-6">
          {headline}
        </h1>

        {/* Subheadline */}
        <p className="font-[family-name:var(--font-outfit)] text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
          {subheadline}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Button variant="primary" size="lg">
            {primaryCta}
          </Button>
          {secondaryCtas.map((cta) => (
            <Button key={cta} variant="ghost" size="lg">
              {cta}
            </Button>
          ))}
        </div>

        {/* Value Props */}
        <ValueProps items={valueProps} />

        {/* Flow Diagram */}
        <div className="mt-16">
          <FlowDiagram steps={flowSteps} />
        </div>
      </div>
    </section>
  );
}
