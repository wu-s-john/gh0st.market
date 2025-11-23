"use client";

import { JobSpec } from "@/components/tables/JobSpecsTable";
import { Button } from "@/components/ui";

interface JobSpecCardProps {
  spec: JobSpec;
  onUseSpec: (spec: JobSpec) => void;
  onClick: (specId: string) => void;
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function truncateText(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function StatusBadge({ active }: { active: boolean }) {
  const colorClass = active
    ? "text-[var(--success)]"
    : "text-[var(--text-muted)]";

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${colorClass}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function JobSpecCard({ spec, onUseSpec, onClick }: JobSpecCardProps) {
  const handleUseSpec = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUseSpec(spec);
  };

  return (
    <div
      onClick={() => onClick(spec.id)}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 cursor-pointer hover:border-[var(--border-hover)] transition-colors duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-[var(--text-primary)] text-lg">
          {spec.mainDomain}
        </h3>
        <StatusBadge active={spec.active} />
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
        {truncateText(spec.description)}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-4">
        <span>Created by: {truncateAddress(spec.creator)}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <span className="text-sm text-[var(--text-secondary)]">
          {spec.jobCount} jobs
        </span>
        <Button size="sm" onClick={handleUseSpec}>
          Use This Spec
        </Button>
      </div>
    </div>
  );
}
