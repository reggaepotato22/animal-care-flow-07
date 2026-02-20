import { AdminNavigation } from "@/components/AdminNavigation";
import { AdminHeader } from "@/components/AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <AdminNavigation />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
