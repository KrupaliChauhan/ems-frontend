import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../ui/Modal";
import Loader from "../ui/Loader";
import { clearSession, getSession, hasRequiredRole, type UserRole } from "../../features/auth/services/auth";
import NotificationBell from "../../features/communications/components/NotificationBell";
import HeaderPunchActions from "../../features/attendance/components/HeaderPunchActions";
import { fetchUserById, type UserDetail } from "../../features/users/services/userService";

type HeaderProps = {
  user?: {
    name?: string;
    role?: UserRole;
  };
  onMenuToggle?: () => void;
};

const pageTitles: Array<{ match: RegExp; title: string }> = [
  { match: /^\/dashboard$/, title: "Dashboard" },
  { match: /^\/communications\/announcements$/, title: "Announcements" },
  { match: /^\/communications\/announcements\/[^/]+$/, title: "Announcement Details" },
  { match: /^\/communications\/events$/, title: "Events" },
  { match: /^\/communications\/events\/[^/]+$/, title: "Event Details" },
  { match: /^\/user$/, title: "Users" },
  { match: /^\/masters\/department$/, title: "Department Master" },
  { match: /^\/masters\/designation$/, title: "Designation Master" },
  { match: /^\/masters\/assets$/, title: "Asset Master" },
  { match: /^\/projects$/, title: "Projects" },
  { match: /^\/projects\/[^/]+$/, title: "Project Details" },
  { match: /^\/my-tasks$/, title: "My Tasks" },
  { match: /^\/leaves$/, title: "Leaves" },
  { match: /^\/leaves\/types$/, title: "Leave Types" },
  { match: /^\/leaves\/requests$/, title: "Leave Requests" },
  { match: /^\/leaves\/calendar$/, title: "Leave Calendar" },
  { match: /^\/leaves\/holidays$/, title: "Holiday Master" },
  { match: /^\/attendance$/, title: "Attendance" },
  { match: /^\/my-attendance$/, title: "My Attendance" },
  { match: /^\/attendance\/self$/, title: "Punch In / Out" },
  { match: /^\/attendance\/manage$/, title: "Attendance Management" },
  { match: /^\/attendance\/policy$/, title: "Attendance Policy" },
  { match: /^\/leaves\/my$/, title: "My Leaves" },
];

const Header = ({ user, onMenuToggle }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [profileError, setProfileError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user: sessionUser } = getSession();

  const initial =
    user?.name && user.name.length > 0
      ? user.name.charAt(0).toUpperCase()
      : "U";

  const pageTitle = useMemo(() => {
    const match = pageTitles.find((item) => item.match.test(location.pathname));
    return match?.title ?? "Employee Management System";
  }, [location.pathname]);
  const canUseSelfAttendance = hasRequiredRole(user?.role, ["employee", "HR", "teamLeader"]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  const openProfile = async () => {
    setOpen(false);
    setProfileOpen(true);
    setProfileError("");

    if (!sessionUser?.id) {
      setProfile(null);
      return;
    }

    setProfileLoading(true);
    try {
      const details = await fetchUserById(sessionUser.id);
      setProfile(details);
    } catch (error) {
      setProfile(null);
      setProfileError(error instanceof Error ? error.message : "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <>
      <header className="relative z-40 px-4 pt-4 sm:px-5 md:px-8 md:pt-5">
        <div className="surface-panel relative isolate flex min-h-[64px] items-center gap-2.5 rounded-[24px] px-3 py-2.5 md:hidden">
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            aria-label="Open navigation menu"
          >
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-teal-700/75">
              Employee Management
            </p>
            <h1 className="mt-0.5 truncate text-[1rem] font-extrabold tracking-tight text-slate-800">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="surface-panel relative isolate hidden rounded-[28px] px-5 py-4 md:block">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-teal-700/75">
                Employee Management
              </p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-800">
                {pageTitle}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {canUseSelfAttendance ? <HeaderPunchActions /> : null}
              <NotificationBell />

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f766e_0%,#d97706_100%)] text-sm font-bold text-white shadow-sm">
                    {initial}
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs capitalize tracking-wide text-slate-500">
                      {user?.role || "role"}
                    </p>
                  </div>
                </button>

                {open && (
                  <div className="float-in absolute right-0 z-[90] mt-3 w-48 rounded-2xl border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,1)] p-2 shadow-[0_20px_40px_rgba(33,29,22,0.16)]">
                    <button
                      onClick={openProfile}
                      className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <Modal open={profileOpen} title="Profile" onClose={() => setProfileOpen(false)} size="sm">
        {profileLoading ? (
          <Loader variant="inline" label="Loading profile..." />
        ) : profileError ? (
          <p className="text-sm text-rose-600">{profileError}</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{profile?.name || sessionUser?.name || "-"}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Email</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{profile?.email || sessionUser?.email || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Role</p>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-800">{profile?.role || sessionUser?.role || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Department</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{profile?.department || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Designation</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{profile?.designation || "-"}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Header;
