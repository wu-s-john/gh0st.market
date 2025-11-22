interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]",
    accent: "bg-[var(--accent-muted)]/20 text-[var(--accent)] border-[var(--accent-muted)]",
  };

  return (
    <span
      className={`
        inline-flex items-center
        px-3 py-1
        text-xs font-medium
        rounded-full
        border
        ${variants[variant]}
      `}
    >
      {children}
    </span>
  );
}
