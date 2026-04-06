import type { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  accentClassName?: string;
};

export default function DashboardCard({
  title,
  value,
  description,
  icon,
  accentClassName = "from-teal-600 via-teal-500 to-amber-500",
}: DashboardCardProps) {
  return (
    <article className="surface-panel group relative overflow-hidden rounded-[24px] p-4 transition-transform duration-200 hover:-translate-y-1">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentClassName}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-700/80">
            {title}
          </p>
          <p className="mt-2 text-[1.7rem] font-extrabold leading-none tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-slate-600">{description}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-teal-700 shadow-sm">
          {icon}
        </div>
      </div>
    </article>
  );
}
