import type { CSSProperties, ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

export type Action<T> = {
  label: string;
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
};

type ServerPagination = {
  enabled: true;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  actions?: Action<T>[];
  serverPagination?: ServerPagination;
  compact?: boolean;
};

type ActionMenuState = {
  rowId: string | number;
  anchorTop: number;
  anchorBottom: number;
  anchorRight: number;
};

const getTooltipText = (content: ReactNode) => {
  if (typeof content === "string" || typeof content === "number") return String(content);
  return null;
};

const renderCellContent = <T,>(column: Column<T>, row: T) => {
  const value = row[column.key];
  const content = column.render ? column.render(value, row) : String(value ?? "");
  const tooltip = getTooltipText(content);

  if (!tooltip) {
    return <div className="min-w-0 max-w-full">{content}</div>;
  }

  return (
    <div className="block w-full min-w-0 max-w-full truncate whitespace-nowrap" title={tooltip}>
      {content}
    </div>
  );
};

function DataTable<T extends { id: string | number }>({
  columns,
  data,
  actions,
  serverPagination,
  compact = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState<ActionMenuState | null>(null);
  const [actionMenuStyle, setActionMenuStyle] = useState<CSSProperties>({});
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const actionAnchorRef = useRef<HTMLButtonElement | null>(null);

  const isServer = !!serverPagination?.enabled;
  const totalItems = isServer ? serverPagination.total : data.length;
  const effectiveLimit = isServer ? serverPagination.limit : rowsPerPage;
  const totalPages = Math.ceil(totalItems / effectiveLimit) || 1;

  const effectivePage = isServer
    ? serverPagination.page
    : Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    if (isServer) return data;
    const start = (effectivePage - 1) * effectiveLimit;
    return data.slice(start, start + effectiveLimit);
  }, [data, isServer, effectivePage, effectiveLimit]);

  const goPrevious = () => {
    if (effectivePage <= 1) return;
    if (isServer) serverPagination.onPageChange(effectivePage - 1);
    else setCurrentPage((p) => p - 1);
  };

  const goNext = () => {
    if (effectivePage >= totalPages) return;
    if (isServer) serverPagination.onPageChange(effectivePage + 1);
    else setCurrentPage((p) => p + 1);
  };

  const handleLimitChange = (value: number) => {
    if (isServer) {
      serverPagination.onLimitChange(value);
      serverPagination.onPageChange(1);
    } else {
      setRowsPerPage(value);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !actionMenuRef.current?.contains(target) &&
        !actionAnchorRef.current?.contains(target)
      ) {
        setOpenActionMenu(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!openActionMenu) return;

    const closeMenu = () => setOpenActionMenu(null);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [openActionMenu]);

  useEffect(() => {
    setOpenActionMenu(null);
  }, [effectivePage, effectiveLimit, data]);

  const activeActionRow = openActionMenu
    ? paginatedData.find((row) => row.id === openActionMenu.rowId) ?? null
    : null;
  const activeActions = activeActionRow && actions
    ? actions.filter((action) => !action.hidden?.(activeActionRow))
    : [];

  useLayoutEffect(() => {
    if (!openActionMenu || !actionMenuRef.current) {
      setActionMenuStyle({});
      return;
    }

    const menuRect = actionMenuRef.current.getBoundingClientRect();
    const viewportPadding = 12;
    const preferredGap = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const availableBelow = viewportHeight - openActionMenu.anchorBottom - viewportPadding;
    const availableAbove = openActionMenu.anchorTop - viewportPadding;

    const top =
      menuRect.height <= availableBelow || availableBelow >= availableAbove
        ? Math.min(
            openActionMenu.anchorBottom + preferredGap,
            viewportHeight - viewportPadding - menuRect.height,
          )
        : Math.max(
            viewportPadding,
            openActionMenu.anchorTop - preferredGap - menuRect.height,
          );

    const left = Math.min(
      Math.max(viewportPadding, openActionMenu.anchorRight - menuRect.width),
      viewportWidth - viewportPadding - menuRect.width,
    );

    setActionMenuStyle({
      top,
      left,
      ...(activeActions.length > 5
        ? { maxHeight: viewportHeight - viewportPadding * 2 }
        : {}),
    });
  }, [openActionMenu, activeActions.length, compact]);

  return (
    <div className="min-w-0 overflow-hidden rounded-[28px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.92)] shadow-[0_18px_40px_rgba(33,29,22,0.08)]">
      <table className={`w-full table-fixed ${compact ? "text-[13px]" : "text-sm"}`}>
        <colgroup>
          {columns.map((col) => (
            <col key={String(col.key)} />
          ))}
          {actions ? <col key="actions" /> : null}
        </colgroup>
        <thead className="bg-[linear-gradient(180deg,rgba(15,118,110,0.06),rgba(255,253,248,0.96))]">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`text-left font-extrabold uppercase tracking-[0.18em] text-slate-500 ${
                  compact ? "px-4 py-2 text-[11px]" : "px-4 py-2 text-[12px]"
                }`}
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th
                className={`text-left font-extrabold uppercase tracking-[0.18em] text-slate-500 ${
                  compact ? "px-4 py-2 text-[11px]" : "px-4 py-2 text-[12px]"
                }`}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {paginatedData.map((row) => (
            <tr
              key={String(row.id)}
              className="border-t border-[rgba(123,97,63,0.1)] transition hover:bg-white/75"
            >
              {columns.map((col) => {
                return (
                  <td
                    key={String(col.key)}
                    className={`min-w-0 align-top text-slate-700 ${
                      compact ? "px-4 py-2 leading-5" : "px-4 py-2 leading-6"
                    }`}
                  >
                    {renderCellContent(col, row)}
                  </td>
                );
              })}

              {actions && (
                <td className={compact ? "px-4 py-2 text-left" : "px-4 py-2 text-left"}>
                  <div className="flex justify-start">
                    <button
                      ref={openActionMenu?.rowId === row.id ? actionAnchorRef : null}
                      type="button"
                      onClick={(event) => {
                        if (openActionMenu?.rowId === row.id) {
                          setOpenActionMenu(null);
                          return;
                        }

                        const rect = event.currentTarget.getBoundingClientRect();
                        actionAnchorRef.current = event.currentTarget;
                        setOpenActionMenu({
                          rowId: row.id,
                          anchorTop: rect.top,
                          anchorBottom: rect.bottom,
                          anchorRight: rect.right,
                        });
                      }}
                      className={`flex items-center justify-center rounded-full border border-[rgba(123,97,63,0.16)] bg-white/90 font-semibold text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900 ${
                        compact ? "h-8 w-8 text-lg" : "h-9 w-9 text-xl"
                      }`}
                      aria-label="Open actions menu"
                    >
                      &#8942;
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}

          {paginatedData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className={compact ? "px-4 py-5 text-center text-slate-500" : "px-4 py-6 text-center text-slate-500"}
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(123,97,63,0.1)] bg-[rgba(250,247,241,0.82)] ${
          compact ? "px-4 py-3" : "px-4 py-4"
        }`}
      >
        <div className={`flex items-center gap-2 leading-6 ${compact ? "text-[13px]" : "text-sm"}`}>
          Rows:
          <select
            value={effectiveLimit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className={`rounded-xl border border-[rgba(123,97,63,0.16)] bg-white/90 shadow-sm ${
              compact ? "px-2.5 py-1 text-[13px]" : "px-3 py-1.5"
            }`}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className={compact ? "text-[13px] leading-6" : "text-sm leading-6"}>
          Page {effectivePage} of {totalPages}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={goPrevious}
            disabled={effectivePage === 1}
            className={`rounded-xl border border-[rgba(123,97,63,0.16)] bg-white/90 font-medium leading-none transition hover:bg-white disabled:opacity-50 ${
              compact ? "px-3 py-1 text-[13px]" : "px-3.5 py-1.5"
            }`}
          >
            Previous
          </button>
          <button
            onClick={goNext}
            disabled={effectivePage === totalPages}
            className={`rounded-xl border border-[rgba(123,97,63,0.16)] bg-white/90 font-medium leading-none transition hover:bg-white disabled:opacity-50 ${
              compact ? "px-3 py-1 text-[13px]" : "px-3.5 py-1.5"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {openActionMenu && activeActionRow && activeActions.length > 0
        ? createPortal(
            <div
              ref={actionMenuRef}
              className={`fixed z-[180] min-w-[180px] max-w-[240px] rounded-2xl border border-[rgba(123,97,63,0.14)] bg-white/98 p-2 shadow-[0_20px_36px_rgba(33,29,22,0.18)] backdrop-blur ${
                activeActions.length > 5 ? "overflow-y-auto" : "overflow-visible"
              }`}
              style={actionMenuStyle}
            >
              <div className="flex flex-col gap-1">
                {activeActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      action.onClick(activeActionRow);
                      setOpenActionMenu(null);
                    }}
                    className={`rounded-xl px-3 py-2 text-left font-semibold leading-none transition ${
                      compact ? "text-[12px]" : "text-sm"
                    } ${
                      action.label.toLowerCase().includes("delete")
                        ? "text-red-600 hover:bg-red-50"
                        : "text-teal-700 hover:bg-teal-50"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default DataTable;
