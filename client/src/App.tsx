import { Switch, Route, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
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
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

// Cache-busting: Force new bundle hash for Cloudflare bypass
const BUILD_VERSION = "2025-11-03-14-40-production";

// Lazy-loaded pages - only load when needed
const EmergencyPage = lazy(() => import("@/pages/emergency"));
const ClinicResultsPage = lazy(() => import("@/pages/clinic-results"));
const MessageStatusPage = lazy(() => import("@/pages/message-status"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const PetsPage = lazy(() => import("@/pages/pets"));
const ClinicsPage = lazy(() => import("@/pages/clinics"));
const DistrictPage = lazy(() => import("@/pages/district"));
const DistrictsIndexPage = lazy(() => import("@/pages/districts-index"));
const ResourcesPage = lazy(() => import("@/pages/resources"));
const FAQPage = lazy(() => import("@/pages/faq"));
const HospitalsPage = lazy(() => import("@/pages/hospitals"));
const HospitalDetailPage = lazy(() => import("@/pages/hospital-detail"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const TermsOfServicePage = lazy(() => import("@/pages/terms-of-service"));

// Admin pages - lazy loaded (heavy bundle)
const AdminHospitalsPage = lazy(() => import("@/pages/admin-hospitals"));
const AdminConfigPage = lazy(() => import("@/pages/admin-config"));
const AdminDashboardPage = lazy(() => import("@/pages/admin-dashboard"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin-analytics"));
const AdminUsersPage = lazy(() => import("@/pages/admin-users"));
const AdminPetsPage = lazy(() => import("@/pages/admin-pets"));
const AdminDiagnosticsPage = lazy(() => import("@/pages/admin-diagnostics"));
const AdminLoginPage = lazy(() => import("@/pages/admin-login"));
const ClinicDashboardPage = lazy(() => import("@/pages/clinic-dashboard"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const hasClinicAccess = user?.clinicId;
  const [location] = useLocation();
  
  // Track page views
  usePageTracking();
  
  // Don't handle API routes - let them go to the server
  if (location.startsWith('/api/')) {
    return null;
  }

  return (
    <Switch>
      {/* Public routes - accessible to everyone */}
      <Route path="/clinics" component={ClinicsPage} />
      <Route path="/hospitals" component={HospitalsPage} />
      <Route path="/hospitals/:slug" component={HospitalDetailPage} />
      <Route path="/districts" component={DistrictsIndexPage} />
      <Route path="/district/:district" component={DistrictPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/emergency" component={EmergencyPage} />
      <Route path="/emergency-results/:requestId" component={ClinicResultsPage} />
      <Route path="/emergency-results/:requestId/messages" component={MessageStatusPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsOfServicePage} />
      
      {/* Home route - show landing page for everyone */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={LoginPage} />
      
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
      <Route path="/admin/hospitals">
        {isAuthenticated && isAdmin ? <AdminHospitalsPage /> : <AdminLoginPage />}
      </Route>
      <Route path="/admin/users">
        {isAuthenticated && isAdmin ? <AdminUsersPage /> : <AdminLoginPage />}
      </Route>
      <Route path="/admin/pets">
        {isAuthenticated && isAdmin ? <AdminPetsPage /> : <AdminLoginPage />}
      </Route>
      <Route path="/admin/config">
        {isAuthenticated && isAdmin ? <AdminConfigPage /> : <AdminLoginPage />}
      </Route>
      <Route path="/admin/diagnostics">
        {isAuthenticated && isAdmin ? <AdminDiagnosticsPage /> : <AdminLoginPage />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.title = "PetSOS";
    
    // Defer Sentry initialization to post-mount to avoid blocking FCP
    initSentry();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Suspense fallback={<PageLoader />}>
              <Router />
            </Suspense>
            <CookieConsent />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
