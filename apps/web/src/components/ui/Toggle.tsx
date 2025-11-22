"use client";

interface ToggleProps {
  options: [string, string];
  value: string;
  onChange: (value: string) => void;
}

export function Toggle({ options, value, onChange }: ToggleProps) {
  const [left, right] = options;

  return (
    <div className="inline-flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
      <button
        onClick={() => onChange(left)}
        className={`
          px-4 py-2 text-sm font-medium rounded-md
          transition-all duration-150 ease-out
          ${
            value === left
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-2)]"
          }
        `}
      >
        {left}
      </button>
      <button
        onClick={() => onChange(right)}
        className={`
          px-4 py-2 text-sm font-medium rounded-md
          transition-all duration-150 ease-out
          ${
            value === right
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-2)]"
          }
        `}
      >
        {right}
      </button>
    </div>
  );
}
