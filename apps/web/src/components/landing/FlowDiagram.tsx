"use client";

import { useEffect, useState } from "react";

interface FlowStep {
  label: string;
  description: string;
}

interface FlowDiagramProps {
  steps: FlowStep[];
}

export function FlowDiagram({ steps }: FlowDiagramProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 800);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="hidden md:flex items-center justify-center gap-4">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          {/* Step Box */}
          <div
            className={`
              relative px-6 py-4 rounded-lg border
              transition-all duration-300 ease-out
              ${
                activeStep === index
                  ? "border-[var(--accent)] bg-[var(--surface)] shadow-[0_0_30px_var(--accent-glow)]"
                  : "border-[var(--border)] bg-[var(--surface)] opacity-50 hover:opacity-100 hover:border-[var(--accent-muted)]"
              }
            `}
          >
            <span
              className={`
                font-[family-name:var(--font-jetbrains-mono)] text-sm font-medium
                ${activeStep === index ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}
              `}
            >
              {step.label}
            </span>
          </div>

          {/* Arrow */}
          {index < steps.length - 1 && (
            <div className="mx-2 text-[var(--text-muted)]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
