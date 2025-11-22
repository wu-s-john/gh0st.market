interface GridItem {
  icon: string;
  title: string;
  description: string;
}

interface GridSectionProps {
  headline: string;
  items: GridItem[];
}

export function GridSection({ headline, items }: GridSectionProps) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-12">
          {headline}
        </h2>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-150"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[var(--text-primary)] mb-2">
                {item.title}
              </h3>
              <p className="font-[family-name:var(--font-outfit)] text-sm text-[var(--text-secondary)] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
