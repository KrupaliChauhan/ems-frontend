import type { ReactNode } from "react";

type DashboardSectionProps = {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function DashboardSection({
  title,
  description,
  action,
  children,
}: DashboardSectionProps) {
  return (
    <section className="surface-panel rounded-[22px] p-3.5 md:rounded-[24px] md:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[0.95rem] font-bold tracking-tight text-slate-900 md:text-base">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-5 text-slate-600 md:text-xs">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-3">{children}</div>
    </section>
  );
}
