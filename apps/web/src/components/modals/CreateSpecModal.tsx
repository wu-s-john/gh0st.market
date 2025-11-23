"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";

export interface CreateJobSpecParams {
  targetDomain: string;
  instructions: string;
  outputSchema: string;
  inputSchema: string;
  validationRules: string;
}

interface CreateSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: CreateJobSpecParams) => void;
  isSubmitting?: boolean;
}

export function CreateSpecModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateSpecModalProps) {
  const [formData, setFormData] = useState<CreateJobSpecParams>({
    targetDomain: "",
    instructions: "",
    outputSchema: "",
    inputSchema: "",
    validationRules: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        targetDomain: "",
        instructions: "",
        outputSchema: "",
        inputSchema: "",
        validationRules: "",
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isValid =
    formData.targetDomain.trim() !== "" &&
    formData.instructions.trim() !== "" &&
    formData.inputSchema.trim() !== "" &&
    formData.outputSchema.trim() !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold text-[var(--text-primary)]">
            Create Job Spec
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
          {/* Target Domain */}
          <div>
            <label
              htmlFor="targetDomain"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Target Domain
            </label>
            <input
              type="text"
              id="targetDomain"
              name="targetDomain"
              value={formData.targetDomain}
              onChange={handleChange}
              placeholder="e.g., crunchbase.com"
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* Instructions */}
          <div>
            <label
              htmlFor="instructions"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="Human/AI readable instructions for fetching the data..."
              rows={4}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Input Schema */}
          <div>
            <label
              htmlFor="inputSchema"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Input Schema (JSON)
            </label>
            <textarea
              id="inputSchema"
              name="inputSchema"
              value={formData.inputSchema}
              onChange={handleChange}
              placeholder='{ "orgSlug": "string" }'
              rows={3}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Output Schema */}
          <div>
            <label
              htmlFor="outputSchema"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Output Schema (JSON)
            </label>
            <textarea
              id="outputSchema"
              name="outputSchema"
              value={formData.outputSchema}
              onChange={handleChange}
              placeholder='{ "name": "string", "funding": "number" }'
              rows={3}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Validation Rules */}
          <div>
            <label
              htmlFor="validationRules"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Validation Rules (optional)
            </label>
            <textarea
              id="validationRules"
              name="validationRules"
              value={formData.validationRules}
              onChange={handleChange}
              placeholder="Rules for validating the output..."
              rows={2}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              disabled={isSubmitting}
            />
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
              {isSubmitting ? "Creating..." : "Create Job Spec"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
