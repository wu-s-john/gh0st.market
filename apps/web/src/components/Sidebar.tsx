"use client";

import { Role, getNavItems, isNavItemActive } from "@/lib/navigation";

interface SidebarProps {
  role: Role;
  currentPath: string;
}

// Icon components
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function SpecsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

const iconMap = {
  dashboard: DashboardIcon,
  specs: SpecsIcon,
};

export function Sidebar({ role, currentPath }: SidebarProps) {
  const navItems = getNavItems(role);
  const roleLabel = role === "requestor" ? "REQUESTOR" : "WORKER";

  return (
    <aside className="w-[220px] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
      {/* Role Label */}
      <div className="px-4 py-4">
        <span className="text-[var(--text-muted)] text-xs font-medium tracking-wider">
          {roleLabel}
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive = isNavItemActive(item.href, currentPath);
          const Icon = iconMap[item.icon];

          return (
            <a
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md mb-1
                text-sm font-medium transition-colors duration-150
                ${
                  isActive
                    ? "bg-[var(--surface-2)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
