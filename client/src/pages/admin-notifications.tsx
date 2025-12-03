import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Bell, 
  Send, 
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Globe,
  RefreshCw,
  PawPrint,
  Building2,
  Calendar,
  Trash2,
  CalendarClock,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { NotificationBroadcast } from "@shared/schema";
import { format, addHours } from "date-fns";

interface PaginatedResponse {
  broadcasts: NotificationBroadcast[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [targetLanguage, setTargetLanguage] = useState("all");
  const [url, setUrl] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");

  const { data: paginatedData, isLoading: historyLoading, refetch } = useQuery<PaginatedResponse>({
    queryKey: ["/api/admin/notifications", currentPage],
  });

  const broadcasts = paginatedData?.broadcasts || [];
  const pagination = paginatedData?.pagination;

  const filteredBroadcasts = broadcasts.filter(broadcast => {
    if (activeTab === "all") return true;
    if (activeTab === "scheduled") return broadcast.status === "scheduled";
    if (activeTab === "sent") return broadcast.status === "sent";
    if (activeTab === "failed") return broadcast.status === "failed" || broadcast.status === "cancelled";
    return true;
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      message: string; 
      targetAudience?: string; 
      targetLanguage?: string; 
      url?: string;
      scheduledFor?: string | null;
    }) => {
      return apiRequest("POST", "/api/admin/notifications/broadcast", {
        title: data.title,
        message: data.message,
        targetRole: data.targetAudience === 'all' ? null : data.targetAudience,
        targetLanguage: data.targetLanguage === 'all' ? null : data.targetLanguage,
        url: data.url || undefined,
        scheduledFor: data.scheduledFor || null,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.scheduledFor ? "Notification Scheduled" : "Notification Sent",
        description: variables.scheduledFor 
          ? "Your notification has been scheduled successfully." 
          : "Your broadcast notification has been sent successfully.",
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed",
        description: error.message || "Failed to process notification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/notifications/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Notification Cancelled",
        description: "The scheduled notification has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Cancel",
        description: error.message || "Failed to cancel notification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setUrl("");
    setTargetAudience("all");
    setTargetLanguage("all");
    setScheduleEnabled(false);
    setScheduledDate("");
    setScheduledTime("");
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please provide both title and message.",
        variant: "destructive",
      });
      return;
    }

    if (title.length > 100) {
      toast({
        title: "Title Too Long",
        description: "Title must be 100 characters or less.",
        variant: "destructive",
      });
      return;
    }

    if (message.length > 500) {
      toast({
        title: "Message Too Long",
        description: "Message must be 500 characters or less.",
        variant: "destructive",
      });
      return;
    }

    let scheduledFor: string | null = null;
    if (scheduleEnabled) {
      if (!scheduledDate || !scheduledTime) {
        toast({
          title: "Missing Schedule",
          description: "Please select both date and time for scheduling.",
          variant: "destructive",
        });
        return;
      }

      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        toast({
          title: "Invalid Schedule",
          description: "Scheduled time must be in the future.",
          variant: "destructive",
        });
        return;
      }
      scheduledFor = scheduledDateTime.toISOString();
    }

    sendMutation.mutate({ 
      title: title.trim(), 
      message: message.trim(),
      targetAudience,
      targetLanguage,
      url: url.trim(),
      scheduledFor
    });
  };

  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const getMinTime = () => {
    if (!scheduledDate) return "";
    const today = new Date().toISOString().split('T')[0];
    if (scheduledDate === today) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      return now.toTimeString().slice(0, 5);
    }
    return "00:00";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />Sending</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><CalendarClock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"><AlertCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const scheduledCount = broadcasts.filter(b => b.status === 'scheduled').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back-admin">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                Push Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Send or schedule broadcast notifications to app users
              </p>
            </div>
          </div>
          {scheduledCount > 0 && (
            <Badge variant="outline" className="text-blue-600 border-blue-300" data-testid="badge-scheduled-count">
              <CalendarClock className="h-3 w-3 mr-1" />
              {scheduledCount} scheduled
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-compose-notification">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Compose Notification
              </CardTitle>
              <CardDescription>
                Create and send or schedule a push notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  data-testid="input-notification-title"
                />
                <p className="text-xs text-gray-500">{title.length}/100 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Notification message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={4}
                  data-testid="input-notification-message"
                />
                <p className="text-xs text-gray-500">{message.length}/500 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger data-testid="select-target-audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All Users
                      </div>
                    </SelectItem>
                    <SelectItem value="pet_owner">
                      <div className="flex items-center gap-2">
                        <PawPrint className="h-4 w-4" />
                        Pet Owners
                      </div>
                    </SelectItem>
                    <SelectItem value="hospital_clinic">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Hospitals / Clinics
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetLanguage">Language Filter</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger data-testid="select-target-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        All Languages
                      </div>
                    </SelectItem>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        English Users
                      </div>
                    </SelectItem>
                    <SelectItem value="zh-HK">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Chinese Users (繁中)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Click URL (optional)</Label>
                <Input
                  id="url"
                  placeholder="https://petsos.site/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  data-testid="input-notification-url"
                />
                <p className="text-xs text-gray-500">Where users go when they click the notification</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="schedule-toggle" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Schedule for later
                    </Label>
                    <p className="text-xs text-gray-500">Send at a specific date and time</p>
                  </div>
                  <Switch
                    id="schedule-toggle"
                    checked={scheduleEnabled}
                    onCheckedChange={setScheduleEnabled}
                    data-testid="switch-schedule-toggle"
                  />
                </div>

                {scheduleEnabled && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="scheduled-date" className="text-xs">Date</Label>
                      <Input
                        id="scheduled-date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={getMinDate()}
                        className="h-9"
                        data-testid="input-scheduled-date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="scheduled-time" className="text-xs">Time</Label>
                      <Input
                        id="scheduled-time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        min={getMinTime()}
                        className="h-9"
                        data-testid="input-scheduled-time"
                      />
                    </div>
                    {scheduledDate && scheduledTime && (
                      <p className="col-span-2 text-xs text-blue-700 dark:text-blue-300">
                        Will send on {format(new Date(`${scheduledDate}T${scheduledTime}`), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || !title.trim() || !message.trim()}
                className={`w-full ${scheduleEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                data-testid="button-send-notification"
              >
                {sendMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {scheduleEnabled ? 'Scheduling...' : 'Sending...'}
                  </>
                ) : scheduleEnabled ? (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Notification
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="card-notification-history">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    All scheduled and sent notifications
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-history">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                  <TabsTrigger value="scheduled" data-testid="tab-scheduled">
                    Scheduled
                    {scheduledCount > 0 && (
                      <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1.5 rounded-full">
                        {scheduledCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sent" data-testid="tab-sent">Sent</TabsTrigger>
                  <TabsTrigger value="failed" data-testid="tab-failed">Other</TabsTrigger>
                </TabsList>
              </Tabs>

              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredBroadcasts.length > 0 ? (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {filteredBroadcasts.map((broadcast) => (
                      <div
                        key={broadcast.id}
                        className="p-3 border rounded-lg bg-white dark:bg-gray-800"
                        data-testid={`notification-${broadcast.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {broadcast.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {broadcast.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(broadcast.status)}
                            {broadcast.status === 'scheduled' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-red-500 hover:text-red-700"
                                    data-testid={`button-cancel-${broadcast.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Scheduled Notification?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will cancel the notification "{broadcast.title}" scheduled for{' '}
                                      {broadcast.scheduledFor 
                                        ? format(new Date(broadcast.scheduledFor), 'MMM d, yyyy \'at\' h:mm a')
                                        : 'later'}. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel data-testid="button-cancel-dialog-cancel">Keep it</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => cancelMutation.mutate(broadcast.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      data-testid="button-confirm-cancel"
                                    >
                                      Yes, Cancel
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {broadcast.status === 'scheduled' && broadcast.scheduledFor ? (
                            <span className="flex items-center gap-1 text-blue-600">
                              <CalendarClock className="h-3 w-3" />
                              {format(new Date(broadcast.scheduledFor), 'MMM d, HH:mm')}
                            </span>
                          ) : (
                            <span>
                              {broadcast.sentAt 
                                ? format(new Date(broadcast.sentAt), 'MMM d, HH:mm')
                                : format(new Date(broadcast.createdAt), 'MMM d, HH:mm')}
                            </span>
                          )}
                          {broadcast.recipientCount !== null && broadcast.recipientCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {broadcast.recipientCount} recipients
                            </span>
                          )}
                          {broadcast.targetLanguage && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {broadcast.targetLanguage === 'zh-HK' ? '繁中' : 'EN'}
                            </span>
                          )}
                          {broadcast.targetRole && (
                            <span className="flex items-center gap-1">
                              {broadcast.targetRole === 'pet_owner' ? (
                                <PawPrint className="h-3 w-3" />
                              ) : (
                                <Building2 className="h-3 w-3" />
                              )}
                              {broadcast.targetRole === 'pet_owner' ? 'Pet Owners' : 'Clinics'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          data-testid="button-prev-page"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                          disabled={currentPage >= pagination.totalPages}
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>
                    {activeTab === 'scheduled' 
                      ? 'No scheduled notifications' 
                      : activeTab === 'sent' 
                        ? 'No sent notifications yet'
                        : 'No notifications yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
