import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import HomePage from "@/pages/home";
import LandingPage from "@/pages/landing";
import EmergencyPage from "@/pages/emergency";
import ClinicResultsPage from "@/pages/clinic-results";
import MessageStatusPage from "@/pages/message-status";
import ProfilePage from "@/pages/profile";
import PetsPage from "@/pages/pets";
import ClinicsPage from "@/pages/clinics";
import AdminClinicsPage from "@/pages/admin-clinics";
import AdminLoginPage from "@/pages/admin-login";
import ClinicDashboardPage from "@/pages/clinic-dashboard";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const hasClinicAccess = user?.clinicId;

  return (
    <Switch>
      {/* Public routes - accessible to everyone */}
      <Route path="/clinics" component={ClinicsPage} />
      <Route path="/emergency" component={EmergencyPage} />
      <Route path="/emergency-results/:requestId" component={ClinicResultsPage} />
      <Route path="/emergency-results/:requestId/messages" component={MessageStatusPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsOfServicePage} />
      
      {/* Home route - show landing page for everyone */}
      <Route path="/" component={LandingPage} />
      
      {/* Protected routes - require authentication */}
      <Route path="/profile">
        {isAuthenticated ? <ProfilePage /> : <LandingPage />}
      </Route>
      <Route path="/pets">
        {isAuthenticated ? <PetsPage /> : <LandingPage />}
      </Route>
      
      {/* Clinic dashboard - for clinic staff */}
      <Route path="/clinic/dashboard">
        {isAuthenticated && hasClinicAccess ? <ClinicDashboardPage /> : <LandingPage />}
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/clinics">
        {isAuthenticated && isAdmin ? <AdminClinicsPage /> : <AdminLoginPage />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.title = "PetSOS";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
