import Sidebar from "./Sidebar";
import Header from "./Header";
import type { UserRole } from "../../features/auth/services/auth";

type LayoutProps = {
  children: React.ReactNode;
  user: {
    name: string;
    role: UserRole;
  };
};

const Layout = ({ children, user }: LayoutProps) => {
  return (
    <div className="app-shell flex h-screen">
      <Sidebar role={user.role} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="content-shell page-enter min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
