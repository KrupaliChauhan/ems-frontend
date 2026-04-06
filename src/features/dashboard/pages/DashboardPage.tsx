import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Loader from "../../../components/ui/Loader";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { getSession } from "../../auth/services/auth";
import DashboardCard from "../components/DashboardCard";
import DashboardLayout from "../components/DashboardLayout";
import DashboardSection from "../components/DashboardSection";
import {
  getDashboardData,
  type DashboardActionItem,
  type DashboardChartItem,
  type DashboardData,
  type DashboardIconKey,
  type DashboardListItem,
  type DashboardProgressItem,
  type DashboardSectionData,
} from "../services/dashboardService";

function DashboardIcon({ name }: { name: DashboardIconKey }) {
  const commonProps = {
    className: "h-4.5 w-4.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "attendance":
      return (
        <svg {...commonProps}>
          <path d="M7 3v3M17 3v3M4 9h16" />
          <rect x="4" y="5" width="16" height="15" rx="3" />
          <path d="m9.5 14 1.8 1.8 3.7-4.3" />
        </svg>
      );
    case "leave":
      return (
        <svg {...commonProps}>
          <path d="M6 20c6 0 11-5 11-11 0-1.7-.4-3.3-1.1-4.7C10.8 4.3 6.6 8.5 6.6 13.6 6.6 16.2 7.7 18.5 9.4 20H6Z" />
          <path d="M14 4c2.8.2 5 2.6 5 5.5 0 2.2-1.2 4.1-3 5" />
        </svg>
      );
    case "tasks":
      return (
        <svg {...commonProps}>
          <path d="M9 6h11M9 12h11M9 18h11" />
          <path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
        </svg>
      );
    case "deadline":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="13" r="7" />
          <path d="M12 10v4l2.5 1.5M9 3h6" />
        </svg>
      );
    case "team":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="3.5" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 4.13a3.5 3.5 0 0 1 0 6.74" />
        </svg>
      );
    case "approval":
      return (
        <svg {...commonProps}>
          <path d="M9 12h6M9 16h4M7 4h10l3 3v13H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <path d="M17 4v3h3" />
        </svg>
      );
    case "project":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="8" height="14" rx="2" />
          <rect x="13" y="9" width="8" height="10" rx="2" />
        </svg>
      );
    case "announcement":
      return (
        <svg {...commonProps}>
          <path d="M4 12V8a2 2 0 0 1 2-2h3l6-2v16l-6-2H6a2 2 0 0 1-2-2v-4Z" />
          <path d="M9 18v2a2 2 0 0 0 2 2" />
        </svg>
      );
    case "users":
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20a6 6 0 0 1 12 0" />
          <path d="M16 7h5M18.5 4.5v5" />
        </svg>
      );
    case "activity":
    default:
      return (
        <svg {...commonProps}>
          <path d="M4 14h4l2-5 4 9 2-4h4" />
        </svg>
      );
  }
}

function ChartSection({ items, emptyMessage }: { items: DashboardChartItem[]; emptyMessage: string }) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  if (items.length === 0) {
    return <p className="text-xs text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const width = maxValue === 0 ? 0 : Math.max((item.value / maxValue) * 100, item.value > 0 ? 10 : 0);
        return (
          <div key={item.id} className="rounded-xl border border-white/70 bg-white/70 px-3 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-[11px] text-slate-500">{item.hint || "Status overview"}</p>
              </div>
              <span className="text-base font-extrabold text-slate-900">{item.value}</span>
            </div>
            <div className="mt-2.5 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${width}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListSection({ items, emptyMessage }: { items: DashboardListItem[]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const content = (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-[rgba(123,97,63,0.12)] bg-white/80 px-3 py-3 transition hover:bg-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-5 text-slate-900">{item.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">{item.subtitle}</p>
              {item.meta ? <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-teal-700/80">{item.meta}</p> : null}
            </div>
            {item.badge ? (
              <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-teal-700">
                {item.badge}
              </span>
            ) : null}
          </div>
        );

        return item.href ? (
          <Link key={item.id} to={item.href} className="block">
            {content}
          </Link>
        ) : (
          <div key={item.id}>{content}</div>
        );
      })}
    </div>
  );
}

function ProgressSection({
  items,
  emptyMessage,
}: {
  items: DashboardProgressItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const total = item.total ?? 100;
        const width = total <= 0 ? 0 : Math.max((item.value / total) * 100, item.value > 0 ? 6 : 0);
        const toneClass =
          item.tone === "amber"
            ? "bg-amber-600"
            : item.tone === "slate"
              ? "bg-slate-700"
              : "bg-teal-600";

        return (
          <div key={item.id} className="rounded-xl border border-white/70 bg-white/80 px-3 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{item.meta || "Progress overview"}</p>
              </div>
              <span className="text-base font-extrabold text-slate-900">{item.value}%</span>
            </div>
            <div className="mt-2.5 h-2 rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${toneClass}`} style={{ width: `${Math.min(width, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuickActions({ items }: { items: DashboardActionItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.path}
          className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[rgba(123,97,63,0.12)] bg-white/85 px-2.5 py-2 text-center text-[13px] font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-white sm:min-h-0 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm sm:leading-none"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function renderSection(section: DashboardSectionData) {
  if (section.kind === "chart") {
    return <ChartSection items={section.items} emptyMessage={section.emptyMessage} />;
  }

  if (section.kind === "progress") {
    return <ProgressSection items={section.items} emptyMessage={section.emptyMessage} />;
  }

  return <ListSection items={section.items} emptyMessage={section.emptyMessage} />;
}

export default function DashboardPage() {
  const { user } = getSession();
  const { data, loading, error } = useAsyncData<DashboardData>(
    () => getDashboardData(user?.role ?? "employee"),
    [user?.role],
    {
      enabled: Boolean(user?.role),
      missingDependencyMessage: "User role is missing for dashboard access.",
    },
  );

  if (loading) {
    return <Loader variant="block" label="Loading dashboard..." />;
  }

  if (!data) {
    return (
      <div className="surface-panel rounded-[24px] p-5">
        <h2 className="text-lg font-bold text-slate-900">Dashboard unavailable</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          {error || "We could not prepare the dashboard right now."}
        </p>
      </div>
    );
  }

  return (
    <DashboardLayout
      top={
        <DashboardSection
          title="Quick Actions"
          description="Shortcuts to the modules you are most likely to use next."
          action={
            error ? (
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Reload
              </Button>
            ) : undefined
          }
        >
          <QuickActions items={data.quickActions} />
        </DashboardSection>
      }
      summaryCards={
        <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
          {data.summaryCards.map((card) => (
            <DashboardCard
              key={card.id}
              title={card.title}
              value={card.value}
              description={card.description}
              icon={<DashboardIcon name={card.icon} />}
              accentClassName={card.accentClassName}
            />
          ))}
        </div>
      }
      middle={
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.middleSections.map((section) => (
            <DashboardSection
              key={section.id}
              title={section.title}
              description={section.description}
            >
              {renderSection(section)}
            </DashboardSection>
          ))}
        </div>
      }
      bottom={
        <div className="grid grid-cols-1 gap-4">
          <DashboardSection
            title={data.activity.title}
            description={data.activity.description}
          >
            <ListSection items={data.activity.items} emptyMessage={data.activity.emptyMessage} />
          </DashboardSection>
        </div>
      }
    />
  );
}
