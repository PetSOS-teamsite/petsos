import { useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role === 'admin') {
      setLocation('/admin/clinics');
    }
  }, [user, setLocation]);

  const handleLogin = () => {
    // Redirect to regular login page with admin return URL
    setLocation('/login?returnTo=/admin/clinics');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold">PetSOS Admin Portal</CardTitle>
          <CardDescription>
            Secure access for administrators and clinic management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Admin Access Required</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This portal is for authorized administrators only. You'll need an admin account to access:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Clinic Management Dashboard
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Staff Account Management
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Emergency Request Overview
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                System Statistics & Analytics
              </li>
            </ul>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
            data-testid="button-admin-login"
          >
            Sign In as Administrator
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Regular user?{" "}
              <a href="/" className="text-red-600 hover:text-red-700 font-medium">
                Go to PetSOS Home
              </a>
            </p>
          </div>

          {user && user.role !== 'admin' && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                ⚠️ Your account does not have admin privileges. Please contact the system administrator for access.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
