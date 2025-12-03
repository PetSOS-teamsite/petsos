import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  Building2, 
  AlertCircle, 
  Activity, 
  Settings,
  PawPrint,
  Hospital,
  Calendar,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { queryClient } from "@/lib/queryClient";

interface AnalyticsOverview {
  totalUsers: number;
  newUsers24h: number;
  newUsers7d: number;
  newUsers30d: number;
  totalPets: number;
  totalEmergencyRequests: number;
  emergencyByStatus: { status: string; count: number }[];
  totalClinics: number;
  activeClinics: number;
  totalHospitals: number;
}

interface EmergencyTrends {
  dailyTrends: { date: string; count: number }[];
  byRegion: { regionId: string; regionName: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

interface UserActivityTrends {
  registrationTrends: { date: string; count: number }[];
  totalActiveUsers: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  broadcasting: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#6b7280",
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>("30");

  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/admin/analytics/overview"],
  });

  const { data: emergencyTrends, isLoading: trendsLoading } = useQuery<EmergencyTrends>({
    queryKey: ["/api/admin/analytics/emergency-trends", dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics/emergency-trends?days=${dateRange}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch emergency trends");
      return response.json();
    },
  });

  const { data: userActivity, isLoading: activityLoading } = useQuery<UserActivityTrends>({
    queryKey: ["/api/admin/analytics/user-activity", dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics/user-activity?days=${dateRange}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user activity");
      return response.json();
    },
  });

  const isLoading = overviewLoading || trendsLoading || activityLoading;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/overview"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/emergency-trends", dateRange] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/user-activity", dateRange] });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const statusPieData = (overview?.emergencyByStatus ?? []).map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    color: STATUS_COLORS[item.status] || "#6b7280",
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
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
                  Platform Analytics
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor platform usage and performance metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]" data-testid="select-date-range">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleRefresh} data-testid="button-refresh">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="hidden sm:flex gap-2">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Overview Metrics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-users">
                      {overviewLoading ? <Skeleton className="h-7 w-16" /> : overview?.totalUsers.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      +{overview?.newUsers24h || 0} today
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">New Users (7d)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-new-users-7d">
                      {overviewLoading ? <Skeleton className="h-7 w-12" /> : overview?.newUsers7d.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <PawPrint className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pets Registered</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-pets">
                      {overviewLoading ? <Skeleton className="h-7 w-12" /> : overview?.totalPets.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Requests</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-emergencies">
                      {overviewLoading ? <Skeleton className="h-7 w-12" /> : overview?.totalEmergencyRequests.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clinics</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-clinics">
                      {overviewLoading ? <Skeleton className="h-7 w-12" /> : overview?.totalClinics.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {overview?.activeClinics || 0} active
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <Hospital className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Hospitals</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-hospitals">
                      {overviewLoading ? <Skeleton className="h-7 w-12" /> : overview?.totalHospitals.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Emergency Request Trends
                </CardTitle>
                <CardDescription>Daily emergency requests over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={emergencyTrends?.dailyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        className="text-xs"
                        stroke="#888"
                      />
                      <YAxis className="text-xs" stroke="#888" />
                      <Tooltip 
                        labelFormatter={formatDate}
                        contentStyle={{ 
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Requests"
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  User Registration Trends
                </CardTitle>
                <CardDescription>New user registrations over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userActivity?.registrationTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        className="text-xs"
                        stroke="#888"
                      />
                      <YAxis className="text-xs" stroke="#888" />
                      <Tooltip 
                        labelFormatter={formatDate}
                        contentStyle={{ 
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Registrations"
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  Requests by Region
                </CardTitle>
                <CardDescription>Top regions by emergency request volume</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : emergencyTrends?.byRegion && emergencyTrends.byRegion.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={emergencyTrends.byRegion} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis type="number" className="text-xs" stroke="#888" />
                      <YAxis 
                        type="category" 
                        dataKey="regionName" 
                        width={100}
                        className="text-xs"
                        stroke="#888"
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" name="Requests" radius={[0, 4, 4, 0]}>
                        {emergencyTrends.byRegion.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No regional data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Request Status Distribution
                </CardTitle>
                <CardDescription>Current status breakdown of all requests</CardDescription>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={true}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No status data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-600" />
              Status Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {overviewLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-3 w-3 rounded-full mb-2" />
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-7 w-12" />
                    </CardContent>
                  </Card>
                ))
              ) : (overview?.emergencyByStatus ?? []).length > 0 ? (
                (overview?.emergencyByStatus ?? []).map((item) => (
                  <Card key={item.status}>
                    <CardContent className="p-4">
                      <div 
                        className="w-3 h-3 rounded-full mb-2"
                        style={{ backgroundColor: STATUS_COLORS[item.status] || '#6b7280' }}
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {item.status}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid={`text-status-${item.status}`}>
                        {item.count.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : null}
            </div>
          </section>

          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Data Refresh</p>
                  <p>
                    Analytics data is fetched in real-time from the database. 
                    Use the refresh button or change the date range to update the charts.
                    For detailed user behavior analytics, visit the{" "}
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
