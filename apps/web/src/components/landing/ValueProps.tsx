interface ValuePropsProps {
  items: { label: string }[];
}

export function ValueProps({ items }: ValuePropsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center gap-2">
          {index > 0 && (
            <span className="hidden md:inline text-[var(--text-muted)]">|</span>
          )}
          <span className="text-sm text-[var(--text-muted)] font-medium">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
