"use client";

// Types matching the contract
export interface JobSpec {
  id: string;
  mainDomain: string;
  notarizeUrl: string;
  description: string;
  promptInstructions: string;
  creator: string;
  createdAt: number;
  active: boolean;
  jobCount: number;
}

interface JobSpecsTableProps {
  specs: JobSpec[];
  onRowClick?: (specId: string) => void;
  emptyMessage?: string;
}

function truncateText(text: string | undefined, maxLength: number = 50): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function StatusBadge({ active }: { active: boolean }) {
  const colorClass = active
    ? "text-[var(--success)]"
    : "text-[var(--text-muted)]";

  return (
    <span className={`inline-flex items-center gap-1.5 ${colorClass}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function JobSpecsTable({ specs, onRowClick, emptyMessage = "No job specs found" }: JobSpecsTableProps) {
  if (specs.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--text-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Domain
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">
              Description
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Jobs
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {specs.map((spec) => (
            <tr
              key={spec.id}
              onClick={() => onRowClick?.(spec.id)}
              className={`
                border-b border-[var(--border)] last:border-b-0
                ${onRowClick ? "cursor-pointer hover:bg-[var(--surface-2)]" : ""}
                transition-colors duration-150
              `}
            >
              <td className="py-3 px-4">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {spec.mainDomain}
                </span>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <span className="text-sm text-[var(--text-secondary)]">
                  {truncateText(spec.description)}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-[var(--text-secondary)]">
                  {spec.jobCount}
                </span>
              </td>
              <td className="py-3 px-4">
                <StatusBadge active={spec.active} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
