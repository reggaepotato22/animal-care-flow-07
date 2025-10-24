import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Patients from "./pages/Patients";
import AddPatient from "./pages/AddPatient";
import PatientDetails from "./pages/PatientDetails";
import Appointments from "./pages/Appointments";
import Records from "./pages/Records";
import NewRecord from "./pages/NewRecord";
import ClinicalRecordDetails from "./pages/ClinicalRecordDetails";
import Staff from "./pages/Staff";
import Reports from "./pages/Reports";
import Labs from "./pages/Labs";
import AddLabResults from "./pages/AddLabResults";
import Postmortem from "./pages/Postmortem";
import NewPostMortem from "./pages/NewPostMortem";
import PostmortemDetails from "./pages/PostmortemDetails";
import Hospitalization from "./pages/Hospitalization";
import Treatments from "./pages/Treatments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/add" element={<AddPatient />} />
            <Route path="/patients/:id" element={<PatientDetails />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/records" element={<Records />} />
            <Route path="/records/new" element={<NewRecord />} />
            <Route path="/records/:id" element={<ClinicalRecordDetails />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/labs" element={<Labs />} />
            <Route path="/labs/results/add/:orderId" element={<AddLabResults />} />
            <Route path="/postmortem" element={<Postmortem />} />
            <Route path="/postmortem/new" element={<NewPostMortem />} />
            <Route path="/postmortem/:id" element={<PostmortemDetails />} />
            <Route path="/hospitalization" element={<Hospitalization />} />
            <Route path="/treatments" element={<Treatments />} />
            <Route path="/reports" element={<Reports />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
