import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  Archive,
  ArchiveRestore,
  Phone,
  Building2,
  RefreshCw,
  Clock,
  User,
  Settings,
  Search,
  Plus,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  FileText,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import type { WhatsappConversation, WhatsappChatMessage, Hospital } from "@shared/schema";

interface ConversationWithHospital extends WhatsappConversation {
  hospital?: Hospital | null;
}

function getStatusIcon(status: string, readAt?: string | Date | null) {
  if (readAt) {
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  }
  switch (status) {
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-gray-400" />;
    case "sent":
      return <Check className="h-3 w-3 text-gray-400" />;
    case "failed":
      return <span className="text-xs text-red-500">!</span>;
    default:
      return <Clock className="h-3 w-3 text-gray-400" />;
  }
}

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Could not play notification sound:', e);
  }
}

function MediaPreview({ message }: { message: WhatsappChatMessage }) {
  const isOutbound = message.direction === "outbound";
  
  if (!message.mediaUrl && message.messageType === "text") {
    return null;
  }
  
  const iconClass = isOutbound ? "text-green-100" : "text-gray-500";
  
  switch (message.messageType) {
    case "image":
      return (
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className={`h-4 w-4 ${iconClass}`} />
          <span className="text-xs opacity-75">Image</span>
          {message.mediaUrl && (
            <a 
              href={message.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs underline opacity-75 hover:opacity-100"
              data-testid={`media-link-${message.id}`}
            >
              View
            </a>
          )}
        </div>
      );
    case "document":
      return (
        <div className="flex items-center gap-2 mb-1">
          <FileText className={`h-4 w-4 ${iconClass}`} />
          <span className="text-xs opacity-75">Document</span>
          {message.mediaUrl && (
            <a 
              href={message.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs underline opacity-75 hover:opacity-100"
              data-testid={`media-link-${message.id}`}
            >
              Download
            </a>
          )}
        </div>
      );
    case "audio":
    case "video":
      return (
        <div className="flex items-center gap-2 mb-1">
          <Play className={`h-4 w-4 ${iconClass}`} />
          <span className="text-xs opacity-75">{message.messageType === "audio" ? "Audio" : "Video"}</span>
          {message.mediaUrl && (
            <a 
              href={message.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs underline opacity-75 hover:opacity-100"
              data-testid={`media-link-${message.id}`}
            >
              Play
            </a>
          )}
        </div>
      );
    default:
      return null;
  }
}

export default function AdminChatsPage() {
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pendingMessage, setPendingMessage] = useState<WhatsappChatMessage | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState("+852");
  const [newChatDisplayName, setNewChatDisplayName] = useState("");
  const [newChatMessage, setNewChatMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatSoundEnabled') !== 'false';
    }
    return true;
  });
  const [sendReadReceipts, setSendReadReceipts] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatReadReceipts') === 'true';
    }
    return false;
  });
  const previousMessagesRef = useRef<WhatsappChatMessage[] | undefined>(undefined);

  const { data: conversations, isLoading: loadingConversations, refetch: refetchConversations } = useQuery<ConversationWithHospital[]>({
    queryKey: ["/api/admin/conversations", showArchived],
    queryFn: async () => {
      const response = await fetch(`/api/admin/conversations?includeArchived=${showArchived}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
    refetchInterval: 10000,
  });

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  const { data: messages, isLoading: loadingMessages, refetch: refetchMessages } = useQuery<WhatsappChatMessage[]>({
    queryKey: ["/api/admin/conversations", selectedConversationId, "messages"],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const response = await fetch(`/api/admin/conversations/${selectedConversationId}/messages`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!selectedConversationId,
    refetchInterval: selectedConversationId ? 5000 : false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (conversationId: string) =>
      apiRequest("POST", `/api/admin/conversations/${conversationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      apiRequest("POST", `/api/admin/conversations/${id}/archive`, { archive }),
    onSuccess: (_, variables) => {
      toast({
        title: variables.archive ? "Conversation Archived" : "Conversation Restored",
        description: variables.archive 
          ? "The conversation has been archived" 
          : "The conversation has been restored",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations"] });
      if (variables.archive && selectedConversationId === variables.id) {
        setSelectedConversationId(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive conversation",
        variant: "destructive",
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiRequest("POST", `/api/admin/conversations/${id}/reply`, { content }),
    onMutate: async ({ content }) => {
      const optimisticMessage: WhatsappChatMessage = {
        id: `temp-${Date.now()}`,
        conversationId: selectedConversationId!,
        direction: "outbound",
        content,
        messageType: "text",
        status: "sent",
        whatsappMessageId: null,
        mediaUrl: null,
        sentAt: new Date(),
        deliveredAt: null,
        readAt: null,
        errorMessage: null,
        createdAt: new Date(),
      };
      setPendingMessage(optimisticMessage);
      setReplyContent("");
      return { optimisticMessage };
    },
    onSuccess: () => {
      setPendingMessage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations", selectedConversationId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations"] });
    },
    onError: (error: any) => {
      setPendingMessage(null);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const newConversationMutation = useMutation({
    mutationFn: async ({ phoneNumber, displayName, message }: { phoneNumber: string; displayName?: string; message: string }) => {
      const response = await apiRequest("POST", "/api/admin/conversations/new", {
        phoneNumber,
        displayName: displayName || undefined,
        content: message,
      });
      const { conversation } = await response.json();
      return conversation;
    },
    onSuccess: (conversation) => {
      toast({
        title: "Conversation Created",
        description: "New conversation started successfully",
      });
      setShowNewChatDialog(false);
      setNewChatPhone("+852");
      setNewChatDisplayName("");
      setNewChatMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations"] });
      setSelectedConversationId(conversation.id);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create conversation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (selectedConversationId && selectedConversation?.unreadCount && selectedConversation.unreadCount > 0) {
      markAsReadMutation.mutate(selectedConversationId);
    }
  }, [selectedConversationId, selectedConversation?.unreadCount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatSoundEnabled', String(soundEnabled));
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatReadReceipts', String(sendReadReceipts));
    }
  }, [sendReadReceipts]);

  useEffect(() => {
    if (messages && previousMessagesRef.current && soundEnabled) {
      const prevIds = new Set(previousMessagesRef.current.map(m => m.id));
      const newInboundMessages = messages.filter(
        m => !prevIds.has(m.id) && m.direction === "inbound"
      );
      if (newInboundMessages.length > 0) {
        playNotificationSound();
      }
    }
    previousMessagesRef.current = messages;
  }, [messages, soundEnabled]);

  const handleSendReply = () => {
    if (!replyContent.trim() || !selectedConversationId) return;
    replyMutation.mutate({ id: selectedConversationId, content: replyContent.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleRefresh = () => {
    refetchConversations();
    if (selectedConversationId) {
      refetchMessages();
    }
    toast({
      title: "Refreshed",
      description: "Conversations and messages have been refreshed",
    });
  };

  const displayMessages = pendingMessage 
    ? [...(messages || []), pendingMessage]
    : messages;

  const filteredConversations = conversations?.filter(c => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (c.displayName?.toLowerCase().includes(search)) ||
      (c.phoneNumber?.toLowerCase().includes(search)) ||
      (c.lastMessagePreview?.toLowerCase().includes(search))
    );
  });

  const unreadTotal = conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) || 0;

  const handleToggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const handleNewConversation = () => {
    if (!newChatPhone.trim() || !newChatMessage.trim()) return;
    newConversationMutation.mutate({
      phoneNumber: newChatPhone.trim(),
      displayName: newChatDisplayName.trim() || undefined,
      message: newChatMessage.trim(),
    });
  };

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                  WhatsApp Chats
                  {unreadTotal > 0 && (
                    <Badge variant="destructive" className="ml-2" data-testid="badge-unread-total">
                      {unreadTotal}
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Two-way messaging with hospitals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleToggleSound}
                title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
                data-testid="button-toggle-sound"
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" data-testid="button-new-chat">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-new-chat">
                  <DialogHeader>
                    <DialogTitle>Start New Conversation</DialogTitle>
                    <DialogDescription>
                      Send a message to a new phone number to start a conversation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-chat-phone">Phone Number</Label>
                      <Input
                        id="new-chat-phone"
                        value={newChatPhone}
                        onChange={(e) => setNewChatPhone(e.target.value)}
                        placeholder="+852 XXXX XXXX"
                        data-testid="input-new-chat-phone"
                      />
                      <p className="text-xs text-muted-foreground">
                        Include country code (e.g., +852 for Hong Kong)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-chat-name">Display Name (Optional)</Label>
                      <Input
                        id="new-chat-name"
                        value={newChatDisplayName}
                        onChange={(e) => setNewChatDisplayName(e.target.value)}
                        placeholder="Hospital Name or Contact"
                        data-testid="input-new-chat-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-chat-message">Initial Message</Label>
                      <Textarea
                        id="new-chat-message"
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={4}
                        data-testid="input-new-chat-message"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewChatDialog(false)}
                      data-testid="button-cancel-new-chat"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleNewConversation}
                      disabled={!newChatPhone.trim() || !newChatMessage.trim() || newConversationMutation.isPending}
                      data-testid="button-send-new-chat"
                    >
                      {newConversationMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="icon" onClick={handleRefresh} data-testid="button-refresh">
                <RefreshCw className={`h-4 w-4 ${loadingConversations ? 'animate-spin' : ''}`} />
              </Button>
              <div className="hidden sm:flex gap-2">
                <Link href="/admin/messages">
                  <Button variant="outline" size="sm" data-testid="button-broadcast-messages">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Broadcasts
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

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
          <Card className="lg:w-1/3 flex flex-col" data-testid="panel-conversations">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-archived" className="text-sm text-muted-foreground">
                    Archived
                  </Label>
                  <Switch
                    id="show-archived"
                    checked={showArchived}
                    onCheckedChange={setShowArchived}
                    data-testid="switch-show-archived"
                  />
                </div>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9"
                  data-testid="input-search-conversations"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                {loadingConversations ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredConversations?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                    <p>No conversations found</p>
                    <p className="text-sm">{searchTerm ? "Try a different search term" : "Incoming messages from hospitals will appear here"}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations?.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selectedConversationId === conversation.id
                            ? "bg-primary/5 border-l-4 border-primary"
                            : ""
                        } ${conversation.isArchived ? "opacity-60" : ""}`}
                        data-testid={`conversation-item-${conversation.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {conversation.displayName || conversation.phoneNumber}
                              </span>
                              {conversation.hospitalId && (
                                <Badge variant="secondary" className="flex-shrink-0 text-xs">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  Hospital
                                </Badge>
                              )}
                              {conversation.isArchived && (
                                <Badge variant="outline" className="flex-shrink-0 text-xs">
                                  <Archive className="h-3 w-3 mr-1" />
                                  Archived
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                              <Phone className="h-3 w-3" />
                              <span className="font-mono">{conversation.phoneNumber}</span>
                            </div>
                            {conversation.lastMessagePreview && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {conversation.lastMessagePreview}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {conversation.lastMessageAt
                                ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })
                                : "No messages"}
                            </span>
                            {(conversation.unreadCount || 0) > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="h-5 min-w-5 flex items-center justify-center text-xs"
                                data-testid={`unread-badge-${conversation.id}`}
                              >
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:w-2/3 flex flex-col" data-testid="panel-messages">
            {selectedConversationId ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedConversation?.displayName || selectedConversation?.phoneNumber}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedConversation?.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 mr-2" title="Send read receipts when viewing messages">
                        <Checkbox
                          id="read-receipts"
                          checked={sendReadReceipts}
                          onCheckedChange={(checked) => setSendReadReceipts(checked === true)}
                          data-testid="checkbox-read-receipts"
                        />
                        <Label htmlFor="read-receipts" className="text-xs text-muted-foreground cursor-pointer">
                          Read receipts
                        </Label>
                      </div>
                      {selectedConversation?.hospitalId && (
                        <Link href={`/admin/hospitals?id=${selectedConversation?.hospitalId}`}>
                          <Button variant="outline" size="sm" data-testid="button-view-hospital">
                            <Building2 className="h-4 w-4 mr-1" />
                            View Hospital
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => archiveMutation.mutate({
                          id: selectedConversationId,
                          archive: !selectedConversation?.isArchived
                        })}
                        disabled={archiveMutation.isPending}
                        data-testid="button-archive"
                      >
                        {selectedConversation?.isArchived ? (
                          <>
                            <ArchiveRestore className="h-4 w-4 mr-1" />
                            Restore
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4 mr-1" />
                            Archive
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full p-4">
                    {loadingMessages ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                            <Skeleton className="h-12 w-48 rounded-lg" />
                          </div>
                        ))}
                      </div>
                    ) : displayMessages?.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {displayMessages?.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                            data-testid={`message-${message.id}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                message.direction === "outbound"
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                              }`}
                            >
                              <MediaPreview message={message} />
                              {message.content && (
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              )}
                              <div className={`flex items-center gap-1 mt-1 text-xs ${
                                message.direction === "outbound"
                                  ? "text-green-100 justify-end"
                                  : "text-gray-500"
                              }`}>
                                <span>
                                  {message.sentAt
                                    ? format(new Date(message.sentAt), "HH:mm")
                                    : message.createdAt
                                    ? format(new Date(message.createdAt), "HH:mm")
                                    : ""}
                                </span>
                                {message.direction === "outbound" && (
                                  getStatusIcon(message.status, message.readAt)
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      disabled={replyMutation.isPending}
                      className="flex-1"
                      data-testid="input-reply"
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyContent.trim() || replyMutation.isPending}
                      data-testid="button-send"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
                <p className="text-sm max-w-md">
                  Choose a conversation from the list on the left to view messages and reply to hospitals.
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
