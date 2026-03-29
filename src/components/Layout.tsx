import { Sidebar } from "@/components/ui/sidebar";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { useAppointmentReminders } from "@/hooks/useAppointmentReminders";

interface LayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Layout({ children, footer }: LayoutProps) {
  useAppointmentReminders();
  return (
    <div className="h-screen bg-background flex w-full overflow-hidden">
      <Navigation />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
}
