"use client";

import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { Toggle } from "@/components/ui";

type ViewMode = "Developer" | "Worker";

interface NavBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function NavBar({ viewMode, onViewModeChange }: NavBarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors duration-150">
          gh0st.market
        </a>

        {/* Toggle */}
        <Toggle
          options={["Developer", "Worker"]}
          value={viewMode}
          onChange={(value) => onViewModeChange(value as ViewMode)}
        />

        {/* Wallet Connect */}
        <DynamicWidget />
      </div>
    </nav>
  );
}
