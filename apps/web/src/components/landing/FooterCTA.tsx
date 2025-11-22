import { Button } from "@/components/ui";

interface FooterCTAProps {
  headline: string;
  primaryCta: string;
}

export function FooterCTA({ headline, primaryCta }: FooterCTAProps) {
  return (
    <section className="py-20 px-6 border-t border-[var(--border)]">
      <div className="max-w-2xl mx-auto text-center">
        {/* Headline */}
        <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8">
          {headline}
        </h2>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button variant="primary" size="lg">
            {primaryCta}
          </Button>
          <Button variant="ghost" size="lg">
            Open Dashboard
          </Button>
        </div>

        {/* Copyright */}
        <p className="mt-16 text-sm text-[var(--text-muted)]">
          &copy; 2024 gh0st.market
        </p>
      </div>
    </section>
  );
}
