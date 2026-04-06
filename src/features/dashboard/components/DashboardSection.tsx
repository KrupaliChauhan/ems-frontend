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
    <section className="surface-panel rounded-[24px] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-600">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-3.5">{children}</div>
    </section>
  );
}
