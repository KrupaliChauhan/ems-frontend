import { useCallback } from "react";
import { useToast } from "./ToastProvider";

function normalizeMessage(message: string, fallback: string) {
  const trimmed = message.trim();
  return trimmed || fallback;
}

export function useNotifier() {
  const { showToast } = useToast();

  const showError = useCallback(
    (message: string) => showToast(normalizeMessage(message, "Something went wrong"), "error"),
    [showToast]
  );

  const showSuccess = useCallback(
    (message: string) => showToast(normalizeMessage(message, "Action completed successfully"), "success"),
    [showToast]
  );

  return {
    showError,
    showSuccess
  };
}
