"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/providers/ToastProvider";

interface TransactionState {
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
}

interface UseTransactionToastOptions {
  pendingMessage?: string;
  confirmingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook to show toast notifications based on transaction state.
 * Automatically updates toast as transaction progresses through states.
 */
export function useTransactionToast(
  state: TransactionState,
  options: UseTransactionToastOptions = {}
) {
  const {
    pendingMessage = "Waiting for signature...",
    confirmingMessage = "Confirming transaction...",
    successMessage = "Transaction confirmed!",
    errorMessage = "Transaction failed",
  } = options;

  const { showToast, updateToast, dismissToast } = useToast();
  const toastIdRef = useRef<string | null>(null);
  const prevStateRef = useRef<string>("");

  useEffect(() => {
    const { isPending, isConfirming, isSuccess, error } = state;

    // Determine current state
    let currentState = "idle";
    if (isPending) currentState = "pending";
    else if (isConfirming) currentState = "confirming";
    else if (isSuccess) currentState = "success";
    else if (error) currentState = "error";

    // Skip if state hasn't changed
    if (currentState === prevStateRef.current) return;
    prevStateRef.current = currentState;

    // Handle state transitions
    if (currentState === "pending") {
      // Show new toast for pending
      toastIdRef.current = showToast(pendingMessage, "pending");
    } else if (currentState === "confirming" && toastIdRef.current) {
      // Update existing toast to confirming
      updateToast(toastIdRef.current, confirmingMessage, "confirming");
    } else if (currentState === "success" && toastIdRef.current) {
      // Update to success (will auto-dismiss)
      updateToast(toastIdRef.current, successMessage, "success");
      toastIdRef.current = null;
    } else if (currentState === "error") {
      const message = error?.message
        ? `${errorMessage}: ${error.message.slice(0, 100)}`
        : errorMessage;

      if (toastIdRef.current) {
        updateToast(toastIdRef.current, message, "error");
      } else {
        showToast(message, "error");
      }
      toastIdRef.current = null;
    } else if (currentState === "idle" && toastIdRef.current) {
      // Clean up any lingering toast
      dismissToast(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, [
    state,
    pendingMessage,
    confirmingMessage,
    successMessage,
    errorMessage,
    showToast,
    updateToast,
    dismissToast,
  ]);

  return toastIdRef.current;
}
