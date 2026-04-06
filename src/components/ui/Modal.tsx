import type { ReactNode } from "react"

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?:"sm"|"md"|"lg"
}

const Modal = ({ open, title, onClose, children, footer, size = "md" }: ModalProps) => {
  if (!open) return null

  const sizeClass =
    size === "sm"
      ? "max-w-sm"
      : size === "lg"
        ? "max-w-3xl"
        : "max-w-lg"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(33,29,22,0.42)] backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div
        className={`float-in relative w-full ${sizeClass} overflow-hidden rounded-[28px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.96)] shadow-[0_28px_60px_rgba(33,29,22,0.16)] backdrop-blur`}
      >
        <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(15,118,110,0.08),transparent)]" />

        <div className="relative flex items-center justify-between border-b border-[rgba(123,97,63,0.12)] px-6 py-5">
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-white/80 px-3 py-1.5 text-slate-500 transition hover:bg-slate-100"
          >
            x
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer && (
          <div className="border-t border-[rgba(123,97,63,0.12)] bg-[rgba(250,247,241,0.75)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal
