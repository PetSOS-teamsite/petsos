import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/home";
import EmergencyPage from "@/pages/emergency";
import ClinicResultsPage from "@/pages/clinic-results";
import MessageStatusPage from "@/pages/message-status";
import ProfilePage from "@/pages/profile";
import PetsPage from "@/pages/pets";
import ClinicsPage from "@/pages/clinics";
import AdminClinicsPage from "@/pages/admin-clinics";
import NotFound from "@/pages/not-found";

function Router() {
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
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
