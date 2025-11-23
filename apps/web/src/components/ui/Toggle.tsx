"use client";

interface ToggleProps {
  options: [string, string];
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className || "w-4 h-4"}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Toggle({ options, value, onChange, isLoading = false }: ToggleProps) {
  const [left, right] = options;

  return (
    <div className={`inline-flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1 ${isLoading ? "cursor-wait" : ""}`}>
      <button
        onClick={() => !isLoading && onChange(left)}
        disabled={isLoading}
        className={`
          px-4 py-2 text-sm font-medium rounded-md
          transition-all duration-150 ease-out
          ${isLoading ? "cursor-wait" : "cursor-pointer"}
          ${
            value === left
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-2)]"
          }
        `}
      >
        {isLoading && value === left ? (
          <span className="flex items-center gap-2">
            <Spinner className="w-4 h-4" />
            {left}
          </span>
        ) : (
          left
        )}
      </button>
      <button
        onClick={() => !isLoading && onChange(right)}
        disabled={isLoading}
        className={`
          px-4 py-2 text-sm font-medium rounded-md
          transition-all duration-150 ease-out
          ${isLoading ? "cursor-wait" : "cursor-pointer"}
          ${
            value === right
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-2)]"
          }
        `}
      >
        {isLoading && value === right ? (
          <span className="flex items-center gap-2">
            <Spinner className="w-4 h-4" />
            {right}
          </span>
        ) : (
          right
        )}
      </button>
    </div>
  );
}
