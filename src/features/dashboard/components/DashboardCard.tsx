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
    <article className="surface-panel group relative h-full overflow-hidden rounded-[18px] px-2.5 py-2.5 transition-transform duration-200 hover:-translate-y-1 md:rounded-[24px] md:p-4">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentClassName}`}
      />

      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-teal-700/80 md:text-[10px] md:tracking-[0.24em]">
            {title}
          </p>
          <p className="mt-1.5 text-[1.35rem] font-extrabold leading-none tracking-tight text-slate-900 md:mt-2 md:text-[1.7rem]">
            {value}
          </p>
          <p className="mt-1 whitespace-pre-line text-[10px] leading-4 text-slate-600 md:mt-1.5 md:text-xs md:leading-5">{description}</p>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/85 text-teal-700 shadow-sm md:h-10 md:w-10 md:rounded-xl">
          {icon}
        </div>
      </div>
    </article>
  );
}
