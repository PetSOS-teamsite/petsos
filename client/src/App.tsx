import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { CookieConsent } from "@/components/CookieConsent";
import { usePageTracking } from "@/hooks/useAnalytics";
import { initSentry } from "@/lib/sentry";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import HomePage from "@/pages/home";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import EmergencyPage from "@/pages/emergency";
import ClinicResultsPage from "@/pages/clinic-results";
import MessageStatusPage from "@/pages/message-status";
import ProfilePage from "@/pages/profile";
import PetsPage from "@/pages/pets";
import ClinicsPage from "@/pages/clinics";
import AdminClinicsPage from "@/pages/admin-clinics";
import AdminConfigPage from "@/pages/admin-config";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminAnalyticsPage from "@/pages/admin-analytics";
import AdminLoginPage from "@/pages/admin-login";
import ClinicDashboardPage from "@/pages/clinic-dashboard";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import NotFound from "@/pages/not-found";

// Initialize Sentry as early as possible
initSentry();

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const hasClinicAccess = user?.clinicId;
  const [location] = useLocation();
  
  // Don't handle API routes - let them go to the server
  if (location.startsWith('/api/')) {
    return null;
  }

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
      <Route path="/login" component={LoginPage} />
      
      {/* Protected routes - require authentication */}
      <Route path="/profile">
        {isAuthenticated ? <ProfilePage /> : <LoginPage />}
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
      <Route path="/admin">
        {isAuthenticated && isAdmin ? <AdminDashboardPage /> : <AdminLoginPage />}
      </Route>
      <Route path="/admin/analytics">
        {isAuthenticated && isAdmin ? <AdminAnalyticsPage /> : <AdminLoginPage />}
      </Route>
      <Route path="/admin/clinics">
        {isAuthenticated && isAdmin ? <AdminClinicsPage /> : <AdminLoginPage />}
      </Route>
      <Route path="/admin/config">
        {isAuthenticated && isAdmin ? <AdminConfigPage /> : <AdminLoginPage />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  usePageTracking();

  useEffect(() => {
    document.title = "PetSOS";
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <CookieConsent />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
