import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Users, Building2, AlertCircle, Clock, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmergencyRequest, User, Clinic } from "@shared/schema";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default function AdminAnalyticsPage() {
  const { data: emergencyRequests, isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/emergency-requests"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: false, // Don't fetch automatically, only if needed
  });

  const { data: clinics, isLoading: clinicsLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  // Calculate analytics metrics
  const now = new Date();
  const last7Days = subDays(now, 7);
  const last30Days = subDays(now, 30);

  const metrics = {
    totalRequests: emergencyRequests?.length ?? 0,
    requestsLast7Days: emergencyRequests?.filter(r => new Date(r.createdAt) >= last7Days).length ?? 0,
    requestsLast30Days: emergencyRequests?.filter(r => new Date(r.createdAt) >= last30Days).length ?? 0,
    requestsToday: emergencyRequests?.filter(r => {
      const created = new Date(r.createdAt);
      return created >= startOfDay(now) && created <= endOfDay(now);
    }).length ?? 0,
    
    totalClinics: clinics?.length ?? 0,
    activeClinics: clinics?.filter(c => c.isAvailable).length ?? 0,
    supportHospitals: clinics?.filter(c => c.isSupportHospital).length ?? 0,
    twentyFourHourClinics: clinics?.filter(c => c.is24Hour).length ?? 0,
    
    averageResponseTime: "N/A", // Would need message data to calculate
    peakHour: "N/A", // Would need to analyze request times
  };

  // Request trend by day (last 7 days)
  const requestTrend = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i);
    const count = emergencyRequests?.filter(r => {
      const created = new Date(r.createdAt);
      return created >= startOfDay(date) && created <= endOfDay(date);
    }).length ?? 0;
    
    return {
      date: format(date, 'MMM d'),
      count,
    };
  });

  // Status breakdown
  const statusBreakdown = {
    pending: emergencyRequests?.filter(r => r.status === 'pending').length ?? 0,
    broadcasting: emergencyRequests?.filter(r => r.status === 'broadcasting').length ?? 0,
    completed: emergencyRequests?.filter(r => r.status === 'completed').length ?? 0,
    cancelled: emergencyRequests?.filter(r => r.status === 'cancelled').length ?? 0,
  };

  const isLoading = requestsLoading || clinicsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin: Analytics
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor platform usage and performance
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm" data-testid="button-admin-dashboard">
                  <Activity className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/clinics">
                <Button variant="outline" size="sm" data-testid="button-admin-clinics">
                  <Building2 className="h-4 w-4 mr-2" />
                  Clinics
                </Button>
              </Link>
              <Link href="/admin/config">
                <Button variant="outline" size="sm" data-testid="button-admin-config">
                  <Settings className="h-4 w-4 mr-2" />
                  Config
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Key Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Requests Today</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-requests-today">
                      {isLoading ? <Skeleton className="h-8 w-12" /> : metrics.requestsToday}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last 7 Days</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? <Skeleton className="h-8 w-12" /> : metrics.requestsLast7Days}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last 30 Days</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? <Skeleton className="h-8 w-12" /> : metrics.requestsLast30Days}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-total-requests">
                      {isLoading ? <Skeleton className="h-8 w-12" /> : metrics.totalRequests}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Clinic Stats */}
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Clinic Network</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Clinics</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? <Skeleton className="h-7 w-12" /> : metrics.totalClinics}
                    </p>
                  </div>
                  <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Now</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? <Skeleton className="h-7 w-12" /> : metrics.activeClinics}
                    </p>
                  </div>
                  <Activity className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">24-Hour</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? <Skeleton className="h-7 w-12" /> : metrics.twentyFourHourClinics}
                    </p>
                  </div>
                  <Clock className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Support Hospitals</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? <Skeleton className="h-7 w-12" /> : metrics.supportHospitals}
                    </p>
                  </div>
                  <Building2 className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Request Trend */}
        <div className="max-w-7xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Request Trend (Last 7 Days)</CardTitle>
              <CardDescription>Daily emergency request volume</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="space-y-3">
                  {requestTrend.map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16">
                        {day.date}
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full flex items-center justify-end pr-2 text-white text-sm font-medium transition-all"
                          style={{
                            width: `${Math.max((day.count / Math.max(...requestTrend.map(d => d.count), 1)) * 100, 3)}%`
                          }}
                        >
                          {day.count > 0 && day.count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Request Status Breakdown</CardTitle>
              <CardDescription>Current distribution of emergency request statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-200">
                      {statusBreakdown.pending}
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Broadcasting</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">
                      {statusBreakdown.broadcasting}
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-400 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-200">
                      {statusBreakdown.completed}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-400 mb-1">Cancelled</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-200">
                      {statusBreakdown.cancelled}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Note about GA4 */}
        <div className="max-w-7xl mx-auto mt-8">
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Google Analytics 4 Integration</p>
                  <p>
                    GA4 is configured and tracking events in real-time. For detailed analytics including page views, user behavior, and conversion metrics, visit the{" "}
                    <a
                      href="https://analytics.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      Google Analytics dashboard
                    </a>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
