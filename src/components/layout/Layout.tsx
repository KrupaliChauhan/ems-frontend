import { useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell flex min-h-screen">
      <Sidebar
        role={user.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col md:max-h-screen md:overflow-hidden">
        <Header user={user} onMenuToggle={() => setSidebarOpen((current) => !current)} />
        <main className="content-shell page-enter min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 pb-5 sm:p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
