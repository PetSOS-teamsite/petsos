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
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { NotificationBroadcast } from "@shared/schema";
import { format } from "date-fns";

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("all");
  const [url, setUrl] = useState("");

  const { data: broadcasts, isLoading: historyLoading, refetch } = useQuery<NotificationBroadcast[]>({
    queryKey: ["/api/admin/notifications/history"],
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { title: string; message: string; targetLanguage?: string; url?: string }) => {
      return apiRequest("POST", "/api/admin/notifications/broadcast", {
        title: data.title,
        message: data.message,
        targetLanguage: data.targetLanguage === 'all' ? null : data.targetLanguage,
        url: data.url || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Notification Sent",
        description: "Your broadcast notification has been sent successfully.",
      });
      setTitle("");
      setMessage("");
      setUrl("");
      setTargetLanguage("all");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Failed to send notification. Please try again.",
        variant: "destructive",
      });
    },
  });

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

    sendMutation.mutate({ 
      title: title.trim(), 
      message: message.trim(), 
      targetLanguage,
      url: url.trim() 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
                Send broadcast notifications to app users
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-compose-notification">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Compose Notification
              </CardTitle>
              <CardDescription>
                Create and send a push notification to your users
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
                <Label htmlFor="targetLanguage">Target Audience</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger data-testid="select-target-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All Users
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

              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || !title.trim() || !message.trim()}
                className="w-full bg-red-600 hover:bg-red-700"
                data-testid="button-send-notification"
              >
                {sendMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
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
                    Recent Broadcasts
                  </CardTitle>
                  <CardDescription>
                    History of sent notifications
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-history">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : broadcasts && broadcasts.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {broadcasts.map((broadcast) => (
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
                        {getStatusBadge(broadcast.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>
                          {broadcast.sentAt 
                            ? format(new Date(broadcast.sentAt), 'MMM d, HH:mm')
                            : format(new Date(broadcast.createdAt), 'MMM d, HH:mm')}
                        </span>
                        {broadcast.recipientCount !== null && (
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
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No notifications sent yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
