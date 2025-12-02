import { Switch, Route, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { CookieConsent } from "@/components/CookieConsent";
import { PushNotificationBanner } from "@/components/PushNotificationBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { usePageTracking } from "@/hooks/useAnalytics";
import { initSentry } from "@/lib/sentry";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

// Cache-busting: Force new bundle hash for Cloudflare bypass
const BUILD_VERSION = "2025-11-27-18-35-full-schema-sync";

// Lazy-loaded pages - only load when needed
const EmergencyPage = lazy(() => import("@/pages/emergency"));
const ClinicResultsPage = lazy(() => import("@/pages/clinic-results"));
const MessageStatusPage = lazy(() => import("@/pages/message-status"));
const EmergencyProfilePage = lazy(() => import("@/pages/emergency-profile"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const PetsPage = lazy(() => import("@/pages/pets"));
const ClinicsPage = lazy(() => import("@/pages/clinics"));
const DistrictPage = lazy(() => import("@/pages/district"));
const DistrictsIndexPage = lazy(() => import("@/pages/districts-index"));
const ResourcesPage = lazy(() => import("@/pages/resources"));
const FAQPage = lazy(() => import("@/pages/faq"));
const HospitalsPage = lazy(() => import("@/pages/hospitals"));
const HospitalDetailPage = lazy(() => import("@/pages/hospital-detail"));
const ClinicOwnerEditPage = lazy(() => import("@/pages/clinic-owner-edit"));
const ClinicOwnerEditVerifiedPage = lazy(() => import("@/pages/clinic-owner-edit-verified"));
const HospitalOwnerEditVerifiedPage = lazy(() => import("@/pages/hospital-owner-edit-verified"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const TermsOfServicePage = lazy(() => import("@/pages/terms-of-service"));

// Admin pages - lazy loaded (heavy bundle)
const AdminHospitalsPage = lazy(() => import("@/pages/admin-hospitals"));
const AdminClinicsPage = lazy(() => import("@/pages/admin-clinics"));
const AdminConfigPage = lazy(() => import("@/pages/admin-config"));
const AdminDashboardPage = lazy(() => import("@/pages/admin-dashboard"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin-analytics"));
const AdminUsersPage = lazy(() => import("@/pages/admin-users"));
const AdminPetsPage = lazy(() => import("@/pages/admin-pets"));
const AdminDiagnosticsPage = lazy(() => import("@/pages/admin-diagnostics"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin-notifications"));
const AdminMessagesPage = lazy(() => import("@/pages/admin-messages"));
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

function PublicRouter() {
  const [location] = useLocation();
  
  // Track page views
  usePageTracking();
  
  // Don't handle API routes - let them go to the server
  if (location.startsWith('/api/')) {
    return null;
  }

  return (
    <Switch>
      {/* Public routes - render immediately without waiting for auth */}
      <Route path="/clinics" component={ClinicsPage} />
      <Route path="/hospitals" component={HospitalsPage} />
      <Route path="/hospitals/:slug" component={HospitalDetailPage} />
      <Route path="/clinic/edit/:id" component={ClinicOwnerEditVerifiedPage} />
      <Route path="/hospital/edit/:slug" component={HospitalOwnerEditVerifiedPage} />
      <Route path="/districts" component={DistrictsIndexPage} />
      <Route path="/district/:district" component={DistrictPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/emergency" component={EmergencyPage} />
      <Route path="/emergency-results/:requestId" component={ClinicResultsPage} />
      <Route path="/emergency-results/:requestId/messages" component={MessageStatusPage} />
      <Route path="/emergency-profile/:requestId" component={EmergencyProfilePage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsOfServicePage} />
      
      {/* Home route - show landing page for everyone */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={LoginPage} />
      
      {/* Protected routes - handled by ProtectedRouter */}
      <Route path="/profile" component={ProtectedProfileRoute} />
      <Route path="/pets" component={ProtectedPetsRoute} />
      <Route path="/clinic/dashboard" component={ProtectedClinicRoute} />
      
      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={ProtectedAdminRoute} />
      <Route path="/admin/analytics" component={ProtectedAdminAnalyticsRoute} />
      <Route path="/admin/hospitals" component={ProtectedAdminHospitalsRoute} />
      <Route path="/admin/clinics" component={ProtectedAdminClinicsRoute} />
      <Route path="/admin/users" component={ProtectedAdminUsersRoute} />
      <Route path="/admin/pets" component={ProtectedAdminPetsRoute} />
      <Route path="/admin/config" component={ProtectedAdminConfigRoute} />
      <Route path="/admin/diagnostics" component={ProtectedAdminDiagnosticsRoute} />
      <Route path="/admin/notifications" component={ProtectedAdminNotificationsRoute} />
      <Route path="/admin/messages" component={ProtectedAdminMessagesRoute} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function ProtectedProfileRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? <ProfilePage /> : <LoginPage />;
}

function ProtectedPetsRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? <PetsPage /> : <LandingPage />;
}

function ProtectedClinicRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  const hasClinicAccess = user?.role === 'clinic_staff' || user?.role === 'hospital_staff';
  return isAuthenticated && hasClinicAccess ? <ClinicDashboardPage /> : <LandingPage />;
}

function ProtectedAdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated && user?.role === 'admin' ? <AdminDashboardPage /> : <AdminLoginPage />;
}

function ProtectedAdminAnalyticsRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated && user?.role === 'admin' ? <AdminAnalyticsPage /> : <AdminLoginPage />;
}

function ProtectedAdminHospitalsRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated && user?.role === 'admin' ? <AdminHospitalsPage /> : <AdminLoginPage />;
}

function ProtectedAdminClinicsRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated && user?.role === 'admin' ? <AdminClinicsPage /> : <AdminLoginPage />;
}

function ProtectedAdminUsersRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated && user?.role === 'admin' ? <AdminUsersPage /> : <AdminLoginPage />;
}

function ProtectedAdminPetsRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated && user?.role === 'admin' ? <AdminPetsPage /> : <AdminLoginPage />;
}

function ProtectedAdminConfigRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated && user?.role === 'admin' ? <AdminConfigPage /> : <AdminLoginPage />;
}

function ProtectedAdminDiagnosticsRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated && user?.role === 'admin' ? <AdminDiagnosticsPage /> : <AdminLoginPage />;
}

function ProtectedAdminNotificationsRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated && user?.role === 'admin' ? <AdminNotificationsPage /> : <AdminLoginPage />;
}

function ProtectedAdminMessagesRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated && user?.role === 'admin' ? <AdminMessagesPage /> : <AdminLoginPage />;
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
              <PublicRouter />
            </Suspense>
            <CookieConsent />
            <PushNotificationBanner />
            <OfflineIndicator />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
