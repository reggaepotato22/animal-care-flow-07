import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { Layout } from "@/components/Layout";
import { AdminLayout } from "@/components/AdminLayout";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import DemoLogin from "./pages/DemoLogin";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClinicSettings from "./pages/admin/ClinicSettings";
import Accounts from "./pages/admin/Accounts";
import AccountDetails from "./pages/admin/AccountDetails";
import Index from "./pages/Index";
import Patients from "./pages/Patients";
import AddPatient from "./pages/AddPatient";
import PatientDetails from "./pages/PatientDetails";
import Appointments from "./pages/Appointments";
import AppointmentDetails from "./pages/AppointmentDetails";
import Records from "./pages/Records";
import NewRecord from "./pages/NewRecord";
import ClinicalRecordDetails from "./pages/ClinicalRecordDetails";
import Staff from "./pages/Staff";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Triage from "./pages/Triage";
import Notifications from "./pages/Notifications";
import NotificationTemplates from "./pages/NotificationTemplates";
import Labs from "./pages/Labs";
import AddLabResults from "./pages/AddLabResults";
import Postmortem from "./pages/Postmortem";
import NewPostMortem from "./pages/NewPostMortem";
import PostmortemDetails from "./pages/PostmortemDetails";
import Hospitalization from "./pages/Hospitalization";
import HospitalizationWorkspace from "./pages/HospitalizationWorkspace";
import SurgeryWorkspace from "./pages/SurgeryWorkspace";
import SurgeryBoard from "./pages/SurgeryBoard";
import Treatments from "./pages/Treatments";
import Inventory from "./pages/Inventory";
import ExternalUpload from "./pages/ExternalUpload";
import UploadPortal from "./pages/UploadPortal";
import GenerateLink from "./pages/GenerateLink";
import Settings from "./pages/Settings";
import SettingsCommunications from "./pages/SettingsCommunications";
import NotFound from "./pages/NotFound";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { EncounterProvider } from "@/contexts/EncounterContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import WorkflowSettings from "./pages/WorkflowSettings";
import AppearanceSettings from "./pages/AppearanceSettings";
import Audit from "./pages/Audit";
import Billing from "./pages/Billing";
import { RoleProvider } from "@/contexts/RoleContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import PatientJourney from "./pages/PatientJourney";
import ReferPatient from "./pages/ReferPatient";
import UserProfile from "./pages/UserProfile";
import { PermissionRoute } from "@/components/PermissionRoute";
import { AppearanceProvider } from "@/contexts/AppearanceContext";
import { AccountProvider } from "@/contexts/AccountContext";
import { TutorialProvider } from "@/contexts/TutorialContext";
import Landing from "./pages/Landing";
import FieldMode from "./pages/FieldMode";
import Pricing from "./pages/Pricing";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { MobileClinicPrompt } from "@/components/MobileClinicPrompt";
import TokenGenerator from "./pages/TokenGenerator";

const queryClient = new QueryClient();

// Redirect authenticated users away from the root landing page straight to the dashboard
function SmartRoot() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  // TutorialProvider wraps protected routes so it resets on every navigation/refresh
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return (
    <FeedbackProvider>
    <MobileClinicPrompt />
    <TutorialProvider>
    <Layout>
      <Routes>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Index />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/add" element={<AddPatient />} />
        <Route path="/patients/:id" element={<PatientDetails />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/:id" element={<AppointmentDetails />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/labs/results/add/:orderId" element={<AddLabResults />} />
        <Route path="/postmortem" element={<Postmortem />} />
        <Route path="/postmortem/new" element={<NewPostMortem />} />
        <Route path="/postmortem/:id" element={<PostmortemDetails />} />
        <Route path="/hospitalization" element={<Hospitalization />} />
        <Route path="/hospitalizations/:id" element={<HospitalizationWorkspace />} />
        <Route path="/surgeries" element={<SurgeryBoard />} />
        <Route path="/surgeries/:id" element={<SurgeryWorkspace />} />
        <Route path="/treatments" element={<Treatments />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/triage" element={<Triage />} />
        <Route path="/records" element={<Records />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/reports" element={<Reports />} />
        {/* Canonical routes */}
        <Route path="/patients/:patientId/encounters/:encounterId" element={<NewRecord />} />
        <Route path="/patients/:patientId/chart" element={<ClinicalRecordDetails />} />
        {/* Legacy alias for /records/new — kept for backward compat */}
        <Route path="/records/new" element={<NewRecord />} />
        {/* /records/:id — view a saved clinical record or active encounter */}
        <Route path="/records/:id" element={<ClinicalRecordDetails />} />
        <Route path="/patients/:id/journey" element={<PatientJourney />} />
        <Route path="/patients/:id/refer" element={<ReferPatient />} />
        <Route path="/workflow-settings" element={<WorkflowSettings />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/communications" element={<SettingsCommunications />} />
        <Route path="/generate-link" element={<GenerateLink />} />
        <Route path="/appearance" element={<AppearanceSettings />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
    </TutorialProvider>
    </FeedbackProvider>
  );
}

function ProtectedField() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <FieldMode />;
}

function ProtectedAdminLayout() {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AdminAuthProvider>
              <AccountProvider>
              <RoleProvider>
                <AppearanceProvider>
                <WorkflowProvider>
                  <EncounterProvider>
                    <NotificationProvider>
                    <Routes>
                      <Route path="/field" element={<ProtectedField />} />
                      <Route path="/tokensag" element={<TokenGenerator />} />
                      <Route path="/" element={<SmartRoot />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/login/demo" element={<DemoLogin />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/external-upload" element={<ExternalUpload />} />
                      <Route path="/upload-portal/:token" element={<UploadPortal />} />
                      <Route path="/admin" element={<ProtectedAdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route element={<PermissionRoute permission="can_manage_users" />}>
                          <Route path="accounts" element={<Accounts />} />
                          <Route path="accounts/:id" element={<AccountDetails />} />
                          <Route path="settings" element={<ClinicSettings />} />
                          <Route path="users" element={<Users />} />
                        </Route>
                        <Route path="notifications" element={<Notifications />} />
                        <Route path="notifications/templates" element={<NotificationTemplates />} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                      <Route path="*" element={<ProtectedRoutes />} />
                    </Routes>
                    </NotificationProvider>
                  </EncounterProvider>
                </WorkflowProvider>
                </AppearanceProvider>
              </RoleProvider>
              </AccountProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
export default App;
