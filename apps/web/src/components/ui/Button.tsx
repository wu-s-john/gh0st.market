"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--accent)] text-white
    hover:bg-[var(--accent-bright)] hover:shadow-[0_0_30px_var(--accent-glow-strong)]
    active:scale-[0.98]
  `,
  secondary: `
    bg-transparent text-[var(--text-secondary)]
    border border-[var(--border)]
    hover:border-[var(--accent)] hover:text-white hover:bg-[var(--surface-2)]
  `,
  ghost: `
    bg-transparent text-[var(--text-secondary)]
    hover:text-white hover:bg-[var(--surface-2)]
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[0.8125rem]",
  md: "px-5 py-2.5 text-[0.875rem]",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          font-[var(--font-outfit)] font-medium
          rounded-md
          cursor-pointer
          transition-all duration-150 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
