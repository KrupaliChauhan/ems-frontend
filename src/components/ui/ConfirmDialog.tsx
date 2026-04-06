import { useEffect } from "react";
import Button from "./Button";
import Modal from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  mode?: "Confirm" | "Success";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  autoCloseMs?: number;
};

const ConfirmDialog = ({
  open,
  title = "Confirm",
  message,
  mode = "Confirm",
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
  autoCloseMs = 900,
}: ConfirmDialogProps) => {
  const isSuccess = mode === "Success";
  const isError = title === "Error";
  const showFooter = !isSuccess && !isError;

  useEffect(() => {
    if (!open || !isSuccess || autoCloseMs <= 0) return;

    const timeoutId = window.setTimeout(() => {
      onConfirm();
    }, autoCloseMs);

    return () => window.clearTimeout(timeoutId);
  }, [autoCloseMs, isSuccess, onConfirm, open]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={isSuccess ? onConfirm : (onCancel ?? onConfirm)}
      size="sm"
      footer={
        showFooter ? (
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              variant={danger ? "danger" : "primary"}
            >
              {confirmText ?? "Yes"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <p className="text-sm leading-6 text-slate-700">{message}</p>
    </Modal>
  );
};

export default ConfirmDialog;