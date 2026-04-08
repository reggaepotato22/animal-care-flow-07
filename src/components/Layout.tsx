import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { useAppointmentReminders } from "@/hooks/useAppointmentReminders";
import { TutorialOverlay, TutorialRelaunchButton } from "@/components/TutorialOverlay";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { MicroSurvey } from "@/components/feedback/MicroSurvey";
import { ParkedPatientsSidebar } from "@/components/ParkedPatientsSidebar";

interface LayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Layout({ children, footer }: LayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useAppointmentReminders();
  return (
    <div className="h-screen bg-background flex w-full overflow-hidden">
      {/* Mobile backdrop — sits behind drawer, above main content */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9980] md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <Navigation
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMobileMenuOpen={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
        {footer}
      </div>
      {/* InnoVetPro Tutorial — auto-triggers on every page load, resets on refresh */}
      <TutorialOverlay />
      <TutorialRelaunchButton />
      {/* Feedback system */}
      <FeedbackButton />
      <FeedbackModal />
      <MicroSurvey />
      {/* Parked Patients floating sidebar */}
      <ParkedPatientsSidebar />
    </div>
  );
}
