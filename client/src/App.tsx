import { Switch, Route } from "wouter";
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
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing page while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/clinics" component={ClinicsPage} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  // Show protected routes when authenticated
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/emergency" component={EmergencyPage} />
      <Route path="/emergency-results/:requestId" component={ClinicResultsPage} />
      <Route path="/emergency-results/:requestId/messages" component={MessageStatusPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/pets" component={PetsPage} />
      <Route path="/clinics" component={ClinicsPage} />
      <Route path="/admin/clinics" component={AdminClinicsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
