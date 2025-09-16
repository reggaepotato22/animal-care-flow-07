import { Sidebar } from "@/components/ui/sidebar";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <Navigation />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}