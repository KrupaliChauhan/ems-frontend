import React from "react";

type InputFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
};

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      helperText,
      error,
      className = "",
      id,
      value,
      onChange,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-900"
          >
            {label} {required ? <span className="text-red-500">*</span> : null}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`
            h-11 w-full rounded-2xl border bg-[rgba(255,253,248,0.92)] px-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition-all duration-200
            placeholder:text-slate-400
            ${
              error
                ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                : "border-[rgba(123,97,63,0.15)] focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            }
            ${className}
          `}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);
InputField.displayName = "InputField";
