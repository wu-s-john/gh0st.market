interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepsSectionProps {
  headline: string;
  steps: Step[];
}

export function StepsSection({ headline, steps }: StepsSectionProps) {
  return (
    <section className="py-20 px-6 bg-[var(--surface)]">
      <div className="max-w-3xl mx-auto">
        {/* Headline */}
        <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-12">
          {headline}
        </h2>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-150"
            >
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[var(--accent)] text-white text-sm font-bold rounded-full">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)] mb-2">
                    {step.title}
                  </h3>
                  <p className="font-[family-name:var(--font-outfit)] text-[var(--text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
