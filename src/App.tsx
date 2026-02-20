import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { Layout } from "@/components/Layout";
import { AdminLayout } from "@/components/AdminLayout";
import Login from "./pages/Login";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
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
import Treatments from "./pages/Treatments";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Index />} />
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
        <Route path="/treatments" element={<Treatments />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/triage" element={<Triage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AdminAuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedAdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="staff" element={<Staff />} />
                <Route path="users" element={<Users />} />
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="notifications/templates" element={<NotificationTemplates />} />
                <Route path="records" element={<Records />} />
                <Route path="records/new" element={<NewRecord />} />
                <Route path="records/:id" element={<ClinicalRecordDetails />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="*" element={<ProtectedRoutes />} />
            </Routes>
          </AdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
