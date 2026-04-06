import type { ReactNode } from "react";

type DashboardLayoutProps = {
  top?: ReactNode;
  summaryCards: ReactNode;
  middle: ReactNode;
  bottom: ReactNode;
};

export default function DashboardLayout({
  top,
  summaryCards,
  middle,
  bottom,
}: DashboardLayoutProps) {
  return (
    <div className="space-y-3 md:space-y-4">
      {top ? <section>{top}</section> : null}
      <section>{summaryCards}</section>
      <section>{middle}</section>
      <section>{bottom}</section>
    </div>
  );
}
