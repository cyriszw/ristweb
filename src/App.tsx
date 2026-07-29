import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { MaintenanceProvider, useMaintenance } from "@/hooks/useMaintenance";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import About from "./pages/About";
import Academics from "./pages/Academics";
import Admissions from "./pages/Admissions";
import ApplicationStatus from "./pages/ApplicationStatus";
import News from "./pages/News";
import Gallery from "./pages/Gallery";
import Clubs from "./pages/Clubs";
import ClubDetail from "./pages/ClubDetail";
import InnovationHub from "./pages/InnovationHub";
import InnovationDetail from "./pages/InnovationDetail";
import Sports from "./pages/Sports";
import SportDetail from "./pages/SportDetail";
import Contact from "./pages/Contact";
import Fees from "./pages/Fees";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Maintenance from "./pages/Maintenance";
import SchoolPortal from "./pages/SchoolPortal";
import NotFound from "./pages/NotFound";
import QuickEditor from "./components/admin/QuickEditor";
import ErrorBoundary from "./components/ErrorBoundary";


const queryClient = new QueryClient();

function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isMaintenanceMode, loading: maintenanceLoading } = useMaintenance();
  const { isAdmin, loading: authLoading, adminChecking } = useAuth();
  const location = useLocation();

  // Always allow admin and login routes
  const isAllowedRoute = location.pathname === '/admin' || location.pathname === '/login';

  if (maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If maintenance mode is on and user is not on allowed route and not admin
  if (isMaintenanceMode && !isAllowedRoute) {
    // Wait for auth to finish before deciding
    if (authLoading || adminChecking) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }
    if (!isAdmin) {
      return <Maintenance />;
    }
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <MaintenanceProvider>
          <BrowserRouter>
            <MaintenanceGuard>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/home" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/academics" element={<Academics />} />
                <Route path="/admissions" element={<ErrorBoundary><Admissions /></ErrorBoundary>} />
                <Route path="/application-status" element={<ErrorBoundary><ApplicationStatus /></ErrorBoundary>} />
                <Route path="/news" element={<News />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/clubs" element={<Clubs />} />
                <Route path="/clubs/:id" element={<ClubDetail />} />
                <Route path="/innovation-hub" element={<InnovationHub />} />
                <Route path="/innovation-hub/:id" element={<InnovationDetail />} />
                <Route path="/sports" element={<Sports />} />
                <Route path="/sports/:id" element={<SportDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/fees" element={<Fees />} />
                <Route path="/school-portal" element={<SchoolPortal />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MaintenanceGuard>
            <QuickEditor />
          </BrowserRouter>

        </MaintenanceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
