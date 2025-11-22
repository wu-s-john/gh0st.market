interface RequirementsProps {
  headline: string;
  items: string[];
  callout: string;
}

export function Requirements({ headline, items, callout }: RequirementsProps) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Headline */}
        <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-8">
          {headline}
        </h2>

        {/* Checklist */}
        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="text-[var(--success)] text-lg">✓</span>
              <span className="font-[family-name:var(--font-outfit)] text-[var(--text-secondary)]">
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Callout */}
        <div className="bg-[var(--surface)] border border-[var(--accent-muted)] rounded-lg p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <p className="font-[family-name:var(--font-outfit)] text-sm text-[var(--text-secondary)] leading-relaxed">
              {callout}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
