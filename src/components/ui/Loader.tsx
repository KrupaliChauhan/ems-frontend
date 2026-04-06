type LoaderSize = "sm" | "md" | "lg";
type LoaderVariant = "inline" | "block" | "overlay" | "fullscreen";

type LoaderProps = {
  label?: string;
  size?: LoaderSize;
  variant?: LoaderVariant;
  className?: string;
  backdropClassName?: string;
  spinnerClassName?: string;
};

const sizeMap: Record<LoaderSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

export default function Loader({
  label = "Loading...",
  size = "md",
  variant = "block",
  className = "",
  backdropClassName = "bg-white/60 backdrop-blur-[1px]",
  spinnerClassName = "",
}: LoaderProps) {
  const spinner = (
    <div
      className={`animate-spin rounded-full border-teal-200 border-t-teal-700 ${sizeMap[size]} ${spinnerClassName}`}
      role="status"
      aria-label={label}
    />
  );

  const content = (
    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.9)] px-4 py-3 shadow-sm">
      {spinner}
      {label ? <span className="text-sm font-medium text-slate-600">{label}</span> : null}
    </div>
  );

  if (variant === "inline") {
    return <span className={className}>{content}</span>;
  }

  if (variant === "block") {
    return <div className={`w-full py-2 ${className}`}>{content}</div>;
  }

  if (variant === "overlay") {
    return (
      <div
        className={`absolute inset-0 z-20 flex items-center justify-center ${backdropClassName} ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${backdropClassName} ${className}`}
    >
      {content}
    </div>
  );
}
