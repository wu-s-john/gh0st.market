"use client";

import { useEffect, useState } from "react";

export type ToastType = "pending" | "confirming" | "success" | "error";

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
  autoDismiss?: boolean;
  autoDismissMs?: number;
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function getToastStyles(type: ToastType) {
  switch (type) {
    case "pending":
    case "confirming":
      return {
        border: "border-[var(--accent-muted)]",
        icon: <Spinner />,
        iconColor: "text-[var(--accent)]",
      };
    case "success":
      return {
        border: "border-[var(--success)]/30",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
        iconColor: "text-[var(--success)]",
      };
    case "error":
      return {
        border: "border-[var(--error)]/30",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        iconColor: "text-[var(--error)]",
      };
  }
}

export function Toast({
  id,
  message,
  type,
  onDismiss,
  autoDismiss = type === "success",
  autoDismissMs = 3000,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const styles = getToastStyles(type);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(id), 150);
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissMs, id, onDismiss]);

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3
        bg-[var(--surface)] border ${styles.border} rounded-lg
        shadow-lg min-w-[280px] max-w-[400px]
        transition-all duration-150
        ${isExiting ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"}
      `}
    >
      <span className={styles.iconColor}>{styles.icon}</span>
      <p className="flex-1 text-sm text-[var(--text-primary)]">{message}</p>
      {type === "error" && (
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onDismiss(id), 150);
          }}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {children}
    </div>
  );
}
