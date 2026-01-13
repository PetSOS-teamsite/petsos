import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Eye,
  MessageSquare,
  MessagesSquare,
  Mail,
  RotateCcw,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

interface MessageStats {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  byType: {
    whatsapp: number;
    email: number;
    line: number;
  };
}

interface Message {
  id: string;
  emergencyRequestId: string;
  hospitalId: string;
  hospitalName: string;
  recipient: string;
  messageType: "whatsapp" | "email" | "line";
  content: string;
  status: "queued" | "sent" | "delivered" | "failed";
  retryCount: number;
  whatsappMessageId?: string | null;
  createdAt: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  petInfo?: {
    name: string;
    species: string;
    breed: string;
  } | null;
}

function getStatusIcon(status: string, readAt?: string | null) {
  if (readAt) {
    return <Eye className="h-4 w-4 text-blue-500" />;
  }
  switch (status) {
    case "queued":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "sent":
      return <Send className="h-4 w-4 text-orange-500" />;
    case "delivered":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <MessageSquare className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusBadge(status: string, readAt?: string | null) {
  if (readAt) {
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Read</Badge>;
  }
  switch (status) {
    case "queued":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Queued</Badge>;
    case "sent":
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">Sent</Badge>;
    case "delivered":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Delivered</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "whatsapp":
      return <MessageSquare className="h-4 w-4 text-green-600" />;
    case "email":
      return <Mail className="h-4 w-4 text-blue-600" />;
    default:
      return <MessageSquare className="h-4 w-4 text-gray-500" />;
  }
}

interface UnreadCount {
  unreadCount: number;
  unreadConversations: number;
}

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery<MessageStats>({
    queryKey: ["/api/admin/messages/stats"],
  });

  const { data: messages, isLoading: loadingMessages, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/admin/messages"],
  });

  const { data: unreadData } = useQuery<UnreadCount>({
    queryKey: ["/api/admin/conversations/unread-count"],
    refetchInterval: 30000,
  });

  const retryMutation = useMutation({
    mutationFn: (messageId: string) =>
      apiRequest("POST", `/api/admin/messages/${messageId}/retry`),
    onSuccess: () => {
      toast({
        title: "Retry Initiated",
        description: "Message has been queued for retry",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to retry message",
        variant: "destructive",
      });
    },
  });

  const refreshAll = () => {
    refetchStats();
    refetchMessages();
    toast({
      title: "Refreshed",
      description: "Message data has been refreshed",
    });
  };

  const filteredMessages = messages?.filter((msg) => {
    switch (activeTab) {
      case "queued":
        return msg.status === "queued";
      case "sent":
        return msg.status === "sent";
      case "delivered":
        return msg.status === "delivered";
      case "read":
        return msg.readAt !== null;
      case "failed":
        return msg.status === "failed";
      default:
        return true;
    }
  });

  return (
    <>
      <SEO noindex={true} />
      <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">WhatsApp Messages</h1>
          <p className="text-muted-foreground">
            Monitor message delivery status and manage failed messages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/chats">
            <Button variant="outline" className="relative" data-testid="link-admin-chats">
              <MessagesSquare className="mr-2 h-4 w-4" />
              Chats
              {unreadData && unreadData.unreadConversations > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 bg-red-500 text-white text-xs"
                  data-testid="badge-unread-chats"
                >
                  {unreadData.unreadConversations}
                </Badge>
              )}
            </Button>
          </Link>
          <Button onClick={refreshAll} variant="outline" data-testid="button-refresh-messages">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Queued</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">{stats?.queued || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">{stats?.sent || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Read</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">{stats?.read || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Type Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Messages by Type</CardTitle>
          <CardDescription>Distribution of messages across different channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <span className="font-medium">WhatsApp:</span>
              <span className="text-muted-foreground">{stats?.byType?.whatsapp || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Email:</span>
              <span className="text-muted-foreground">{stats?.byType?.email || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <span className="font-medium">LINE:</span>
              <span className="text-muted-foreground">{stats?.byType?.line || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
          <CardDescription>View and manage all broadcast messages</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all">All ({messages?.length || 0})</TabsTrigger>
              <TabsTrigger value="queued" data-testid="tab-queued">Queued ({stats?.queued || 0})</TabsTrigger>
              <TabsTrigger value="sent" data-testid="tab-sent">Sent ({stats?.sent || 0})</TabsTrigger>
              <TabsTrigger value="delivered" data-testid="tab-delivered">Delivered ({stats?.delivered || 0})</TabsTrigger>
              <TabsTrigger value="read" data-testid="tab-read">Read ({stats?.read || 0})</TabsTrigger>
              <TabsTrigger value="failed" data-testid="tab-failed">Failed ({stats?.failed || 0})</TabsTrigger>
            </TabsList>
          </Tabs>

          {loadingMessages ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredMessages?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages found in this category
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Type</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Pet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamps</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages?.map((msg) => (
                    <TableRow key={msg.id} data-testid={`row-message-${msg.id}`}>
                      <TableCell>{getTypeIcon(msg.messageType)}</TableCell>
                      <TableCell className="font-medium">{msg.hospitalName}</TableCell>
                      <TableCell className="font-mono text-sm">{msg.recipient}</TableCell>
                      <TableCell>
                        {msg.petInfo ? (
                          <span className="text-sm">
                            {msg.petInfo.name} ({msg.petInfo.species})
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(msg.status, msg.readAt)}
                            {getStatusBadge(msg.status, msg.readAt)}
                          </div>
                          {msg.errorMessage && (
                            <span className="text-xs text-red-500 max-w-xs truncate" title={msg.errorMessage}>
                              {msg.errorMessage}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground gap-0.5">
                          <span>Created: {format(new Date(msg.createdAt), "MMM d, HH:mm")}</span>
                          {msg.sentAt && <span>Sent: {format(new Date(msg.sentAt), "HH:mm:ss")}</span>}
                          {msg.deliveredAt && <span>Delivered: {format(new Date(msg.deliveredAt), "HH:mm:ss")}</span>}
                          {msg.readAt && <span className="text-blue-600">Read: {format(new Date(msg.readAt), "HH:mm:ss")}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {msg.status === "failed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryMutation.mutate(msg.id)}
                            disabled={retryMutation.isPending}
                            data-testid={`button-retry-${msg.id}`}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Coexistence Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Manual Engagement with WhatsApp Coexistence</CardTitle>
          <CardDescription>
            Use the same WhatsApp number for automated broadcasts and manual follow-ups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            WhatsApp Coexistence (launched 2024) allows you to use the WhatsApp Business App on your phone 
            simultaneously with the API automation. This means you can:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Receive reply messages from hospitals in your phone's WhatsApp Business App</li>
            <li>Manually respond to hospital inquiries and coordinate care</li>
            <li>Continue automated emergency broadcasts via the API</li>
            <li>View full conversation history on your phone</li>
          </ul>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Setup Steps:</h4>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Open Meta Business Suite → WhatsApp Manager</li>
              <li>Go to Phone Numbers → Your business number</li>
              <li>Enable "Use WhatsApp Business app" toggle</li>
              <li>Scan QR code with WhatsApp Business App on your phone</li>
              <li>Messages sent via API will appear in your app; you can reply manually</li>
            </ol>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
