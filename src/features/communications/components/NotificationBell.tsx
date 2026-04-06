import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem
} from "../services/communicationService";
import { formatDateTime } from "../../../utils/date";

const formatNotificationTimestamp = (value: string) => {
  return formatDateTime(value);
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getNotifications(8);
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // fail silently in header
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    const intervalId = window.setInterval(() => {
      void load();
    }, 60000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [load]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen((current) => !current);
    await load();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await load();
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.readAt) {
      await markNotificationRead(item.id);
    }
    setOpen(false);
    await load();
    navigate(item.link);
  };

  return (
    <div className="relative z-[85]" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:bg-white sm:h-12 sm:w-12"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5 text-slate-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute right-0 top-0 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="float-in absolute right-0 z-[95] mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-[24px] border border-[rgba(123,97,63,0.14)] bg-[rgba(255,253,248,1)] p-3 shadow-[0_28px_56px_rgba(33,29,22,0.22)] sm:w-[340px]">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-teal-700 transition hover:text-teal-800"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No notifications yet.
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    item.readAt
                      ? "border-slate-200 bg-[rgba(255,253,248,1)] hover:border-slate-300"
                      : "border-teal-200 bg-[rgba(236,253,245,1)] hover:bg-[rgba(209,250,229,1)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                    </div>
                    {!item.readAt ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500" /> : null}
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {formatNotificationTimestamp(item.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
