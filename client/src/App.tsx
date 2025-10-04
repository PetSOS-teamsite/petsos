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

  return (
    <Switch>
      {/* Public routes - accessible to everyone */}
      <Route path="/clinics" component={ClinicsPage} />
      <Route path="/emergency" component={EmergencyPage} />
      <Route path="/emergency-results/:requestId" component={ClinicResultsPage} />
      <Route path="/emergency-results/:requestId/messages" component={MessageStatusPage} />
      
      {/* Home route - landing for logged out, home for logged in */}
      <Route path="/">
        {isLoading ? <LandingPage /> : isAuthenticated ? <HomePage /> : <LandingPage />}
      </Route>
      
      {/* Protected routes - require authentication */}
      <Route path="/profile">
        {isAuthenticated ? <ProfilePage /> : <LandingPage />}
      </Route>
      <Route path="/pets">
        {isAuthenticated ? <PetsPage /> : <LandingPage />}
      </Route>
      <Route path="/admin/clinics">
        {isAuthenticated ? <AdminClinicsPage /> : <LandingPage />}
      </Route>
      
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
