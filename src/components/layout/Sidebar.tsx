import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { UserRole } from "../../features/auth/services/auth";
import { menuItems } from "./menuConfig";

type SidebarProps = {
  role: UserRole;
  isOpen?: boolean;
  onClose?: () => void;
};

const Sidebar = ({ role, isOpen = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const items = useMemo(
    () =>
      menuItems
        .map((item) => {
          const children = item.children?.filter((child) =>
            child.roles.includes(role),
          );
          return {
            ...item,
            children,
          };
        })
        .filter(
          (item) =>
            item.roles.includes(role) &&
            (!item.children || item.children.length > 0),
        ),
    [role],
  );

  const isPathActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const toggleGroup = (label: string, path?: string) => {
    if (path) {
      navigate(path);
      onClose?.();
    }

    setOpenGroup((current) => (current === label ? null : label));
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-300 md:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`surface-panel fixed inset-y-0 left-0 z-50 flex h-dvh w-[16rem] max-w-[calc(100vw-1.5rem)] shrink-0 flex-col overflow-hidden border-r border-[rgba(123,97,63,0.12)] bg-[linear-gradient(180deg,rgba(246,241,231,0.96)_0%,rgba(239,232,219,0.98)_100%)] text-slate-700 transition-transform duration-300 md:sticky md:top-0 md:z-auto md:h-screen md:w-72 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.18),transparent_62%)]" />

        <div className="relative flex h-20 items-center justify-between px-5 md:h-24 md:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-700/80 md:text-[11px] md:tracking-[0.32em]">
              Workspace
            </p>
            <span className="mt-1 block text-xl font-extrabold tracking-tight text-slate-800 md:text-2xl">
              EMS
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-lg text-slate-600 shadow-sm md:hidden"
            aria-label="Close navigation"
          >
            {"\u00D7"}
          </button>
        </div>

        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-[rgba(15,118,110,0.28)] to-transparent md:mx-6" />

        <nav className="hide-scrollbar relative mt-3 flex-1 space-y-1.5 overflow-y-auto px-3 py-5 md:mt-4 md:space-y-2 md:px-4 md:py-7">
          {items.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const childActive =
              item.children?.some((child) => isPathActive(child.path)) ?? false;
            const parentActive = item.path ? isPathActive(item.path) : false;
            const isExpanded = openGroup === item.label;
            const baseClasses = `
            group relative flex w-full items-center gap-2.5 rounded-2xl px-3 py-3 text-left text-xs font-semibold leading-5 transition-all duration-200 md:gap-3 md:px-4 md:py-3.5 md:text-sm md:leading-6
            ${
              parentActive || childActive
                ? "bg-[linear-gradient(135deg,#0f766e_0%,#115e59_100%)] text-white shadow-[0_12px_28px_rgba(15,118,110,0.22)]"
                : "text-slate-600 hover:bg-white/75 hover:text-slate-900"
            }
          `;

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label, item.path)}
                    className={baseClasses}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-current/70" />
                    <span className="flex-1">{item.label}</span>
                    <span
                      className={`text-xs transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    >
                      {"\u25BE"}
                    </span>
                  </button>
                ) : item.path ? (
                  <NavLink to={item.path} className={baseClasses} onClick={handleNavClick}>
                    <span className="h-2.5 w-2.5 rounded-full bg-current/70" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    className={baseClasses}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-current/70" />
                    <span className="flex-1">{item.label}</span>
                    <span
                      className={`text-xs transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    >
                      {"\u25BE"}
                    </span>
                  </button>
                )}

                {hasChildren ? (
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isExpanded
                        ? "mt-2 grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="ml-4 space-y-1.5 border-l border-[rgba(15,118,110,0.18)] pl-3 md:ml-5 md:space-y-2 md:pl-4">
                        {item.children?.map((child, index) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={handleNavClick}
                            className={({ isActive }) => `
                            flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 md:gap-3 md:px-4 md:py-3 md:text-sm
                            ${
                              isActive
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
                            }
                          `}
                            style={{
                              transitionDelay: isExpanded
                                ? `${index * 35}ms`
                                : "0ms",
                            }}
                          >
                            <span className="h-2 w-2 rounded-full bg-teal-600/70" />
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="relative border-t border-[rgba(123,97,63,0.12)] px-5 py-3.5 md:px-6 md:py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 md:text-[11px] md:tracking-[0.26em]">
            Netpair Infotech LLP
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
