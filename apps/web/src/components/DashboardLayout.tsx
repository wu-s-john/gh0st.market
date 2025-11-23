"use client";

import { useState } from "react";
import { useDynamicContext, DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Toggle } from "@/components/ui";
import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar";
import { Role, getEquivalentPath } from "@/lib/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: Role;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { primaryWallet } = useDynamicContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to home if not connected
  useEffect(() => {
    if (!primaryWallet) {
      router.push("/");
    }
  }, [primaryWallet, router]);

  if (!primaryWallet) {
    return null;
  }

  const handleRoleChange = (newRole: string) => {
    const targetRole = newRole.toLowerCase() as Role;
    if (targetRole !== role) {
      const newPath = getEquivalentPath(pathname, targetRole);
      router.push(newPath);
    }
  };

  const toggleValue = role === "requestor" ? "Requestor" : "Worker";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Bar - Desktop */}
      <header className="hidden md:block border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="h-16 px-6 flex items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors duration-150"
          >
            gh0st.market
          </a>

          {/* Role Toggle */}
          <Toggle
            options={["Requestor", "Worker"]}
            value={toggleValue}
            onChange={handleRoleChange}
          />

          {/* Wallet */}
          <DynamicWidget />
        </div>
      </header>

      {/* Top Bar - Mobile */}
      <header className="md:hidden border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="h-14 px-4 flex items-center justify-between">
          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          {/* Logo */}
          <a
            href="/"
            className="font-[family-name:var(--font-jetbrains-mono)] text-base font-bold text-[var(--text-primary)]"
          >
            gh0st.market
          </a>

          {/* Wallet */}
          <DynamicWidget />
        </div>
      </header>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        role={role}
        currentPath={pathname}
        onRoleChange={handleRoleChange}
        currentRoleValue={toggleValue}
      />

      {/* Main Layout */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <div className="h-[calc(100vh-64px)] sticky top-16">
            <Sidebar role={role} currentPath={pathname} />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 min-h-[calc(100vh-64px)]">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
