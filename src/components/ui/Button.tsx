import React from "react";

type Variant = "primary" | "secondary" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary: "border border-teal-700/80 bg-[linear-gradient(135deg,#0f766e_0%,#115e59_100%)] text-white shadow-[0_12px_24px_rgba(15,118,110,0.18)] hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(15,118,110,0.24)]",
  secondary: "border border-white/70 bg-white/85 text-slate-800 shadow-sm hover:-translate-y-0.5 hover:bg-white",
  outline: "border border-[rgba(123,97,63,0.16)] bg-[rgba(255,253,248,0.88)] text-slate-800 hover:-translate-y-0.5 hover:bg-white",
  danger: "border border-rose-700/80 bg-[linear-gradient(135deg,#e11d48_0%,#be123c_100%)] text-white shadow-[0_12px_24px_rgba(225,29,72,0.18)] hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(225,29,72,0.24)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4",
  md: "h-10 px-5",
  lg: "h-11 px-6 text-base",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2.5 rounded-2xl text-sm font-semibold leading-none tracking-[0.01em] transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2
          disabled:pointer-events-none disabled:opacity-50
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Loading
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";
export default Button;
