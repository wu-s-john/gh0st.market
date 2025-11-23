"use client";

// Types matching the contract
export type JobStatus = "Open" | "Completed";

export interface Job {
  id: string;
  specId: string;
  targetDomain: string;
  status: JobStatus;
  bounty: string;
  token: string;
  createdAt: number;
  requester: string;
}

interface JobsTableProps {
  jobs: Job[];
  onRowClick?: (jobId: string) => void;
  emptyMessage?: string;
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function StatusBadge({ status }: { status: JobStatus }) {
  const colorClass = status === "Open"
    ? "text-[var(--accent)]"
    : "text-[var(--success)]";

  return (
    <span className={`inline-flex items-center gap-1.5 ${colorClass}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function JobsTable({ jobs, onRowClick, emptyMessage = "No jobs found" }: JobsTableProps) {
  if (jobs.length === 0) {
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
              Job ID
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Spec
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Requester
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Status
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Bounty
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              onClick={() => onRowClick?.(job.id)}
              className={`
                border-b border-[var(--border)] last:border-b-0
                ${onRowClick ? "cursor-pointer hover:bg-[var(--surface-2)]" : ""}
                transition-colors duration-150
              `}
            >
              <td className="py-3 px-4">
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-primary)]">
                  {truncateAddress(job.id)}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-[var(--text-secondary)]">
                  {job.targetDomain}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-muted)]">
                  {truncateAddress(job.requester)}
                </span>
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={job.status} />
              </td>
              <td className="py-3 px-4 text-right">
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--success)]">
                  {job.bounty} {job.token}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
