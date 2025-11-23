"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { JobSpec } from "@/components/tables/JobSpecsTable";

export interface CreateJobParams {
  specId: string;
  inputs: string;
  bounty: string;
  token: string;
  requesterContact: string;
}

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: CreateJobParams) => void;
  spec: JobSpec | null;
  isSubmitting?: boolean;
}

const SUPPORTED_TOKENS = ["USDC", "ETH", "SOL", "BTC"];

export function CreateJobModal({
  isOpen,
  onClose,
  onSubmit,
  spec,
  isSubmitting = false,
}: CreateJobModalProps) {
  const [formData, setFormData] = useState<Omit<CreateJobParams, "specId">>({
    inputs: "",
    bounty: "",
    token: "USDC",
    requesterContact: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        inputs: "",
        bounty: "",
        token: "USDC",
        requesterContact: "",
      });
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen || !spec) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      specId: spec.id,
      ...formData,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isValid =
    formData.inputs.trim() !== "" &&
    formData.bounty.trim() !== "" &&
    parseFloat(formData.bounty) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold text-[var(--text-primary)]">
            Create Job
          </h2>
          <button
            onClick={() => !isSubmitting && onClose()}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close"
            disabled={isSubmitting}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Spec Info */}
          <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md">
            <span className="text-xs text-[var(--text-muted)]">Using Spec:</span>
            <p className="font-medium text-[var(--text-primary)]">
              {spec.mainDomain}
            </p>
          </div>

          {/* Inputs */}
          <div>
            <label
              htmlFor="inputs"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Inputs (JSON)
            </label>
            <textarea
              id="inputs"
              name="inputs"
              value={formData.inputs}
              onChange={handleChange}
              placeholder='{ "orgSlug": "anthropic" }'
              rows={4}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              disabled={isSubmitting}
            />
            {(() => {
              // Try to parse inputSchema for field types
              let schemaFields: { name: string; type: string }[] = [];

              if (spec.inputSchema && spec.inputSchema !== "{}") {
                try {
                  const schema = JSON.parse(spec.inputSchema);
                  if (schema.properties) {
                    schemaFields = Object.entries(schema.properties).map(([name, prop]) => ({
                      name,
                      type: (prop as { type?: string }).type || "string",
                    }));
                  }
                } catch {
                  // Invalid JSON, fall through to URL placeholders
                }
              }

              // Fall back to URL placeholders if no schema fields found
              if (schemaFields.length === 0) {
                const placeholders = spec.notarizeUrl.match(/\{\{(\w+)\}\}/g);
                if (placeholders && placeholders.length > 0) {
                  schemaFields = placeholders.map(p => ({
                    name: p.replace(/[{}]/g, ""),
                    type: "string",
                  }));
                }
              }

              if (schemaFields.length === 0) return null;

              return (
                <div className="mt-2 p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs">
                  <span className="text-[var(--text-muted)]">Expected fields:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {schemaFields.map(({ name, type }) => (
                      <span key={name} className="inline-flex items-center gap-1">
                        <code className="font-[family-name:var(--font-jetbrains-mono)] text-[var(--text-primary)]">{name}</code>
                        <span className="text-[var(--text-muted)]">:</span>
                        <span className="text-[var(--info)]">{type}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bounty */}
          <div>
            <label
              htmlFor="bounty"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Bounty
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                id="bounty"
                name="bounty"
                value={formData.bounty}
                onChange={handleChange}
                placeholder="0.50"
                step="0.01"
                min="0"
                className="flex-1 px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                disabled={isSubmitting}
              />
              <select
                name="token"
                value={formData.token}
                onChange={handleChange}
                className="px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
                disabled={isSubmitting}
              >
                {SUPPORTED_TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Requester Contact */}
          <div>
            <label
              htmlFor="requesterContact"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Requester Contact (optional)
            </label>
            <input
              type="text"
              id="requesterContact"
              name="requesterContact"
              value={formData.requesterContact}
              onChange={handleChange}
              placeholder="0zk..."
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              disabled={isSubmitting}
            />
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              Optional RAILGUN address for private communication
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create & Fund Job"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
