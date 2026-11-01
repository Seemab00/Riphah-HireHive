import RoleGuard from "@/components/RoleGuard";
import Sidebar from "@/components/Sidebar";

// This layout wraps every page inside the /admin folder.
// 1. RoleGuard lets only the admin in.
// 2. Sidebar is shown on the left of every admin page.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="admin">
      <div className="flex min-h-screen">
        <Sidebar />
        {/* The page itself (dashboard, registrations...) appears here. */}
        <main className="flex-1 p-8 print:p-0">{children}</main>
      </div>
    </RoleGuard>
  );
}
