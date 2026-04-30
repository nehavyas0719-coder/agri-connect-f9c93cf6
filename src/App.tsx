import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import Index from "./pages/Index.tsx";
import OfficerLogin from "./pages/OfficerLogin.tsx";
import OfficerSignup from "./pages/OfficerSignup.tsx";
import Policies from "./pages/Policies.tsx";
import Feedback from "./pages/Feedback.tsx";
import OfficerDashboard from "./pages/OfficerDashboard.tsx";
import AddScheme from "./pages/AddScheme.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/officer/login" element={<OfficerLogin />} />
            <Route path="/officer/signup" element={<OfficerSignup />} />

            <Route path="/policies" element={<RoleGuard allow="farmer"><Policies /></RoleGuard>} />
            <Route path="/feedback" element={<RoleGuard allow="farmer"><Feedback /></RoleGuard>} />

            <Route path="/officer/dashboard" element={<RoleGuard allow="officer"><OfficerDashboard /></RoleGuard>} />
            <Route path="/officer/add-scheme" element={<RoleGuard allow="officer"><AddScheme /></RoleGuard>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
