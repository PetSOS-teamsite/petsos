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
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Search,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

interface HospitalOutreach {
  id: string;
  slug: string;
  nameEn: string | null;
  nameZh: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  verificationCode: string | null;
  verificationCodeExpiresAt: string | null;
  lastConfirmedAt: string | null;
  confirmedByName: string | null;
  inviteSentAt: string | null;
  isAvailable: boolean;
  status: "confirmed" | "pending";
}

function getStatusBadge(hospital: HospitalOutreach) {
  if (hospital.lastConfirmedAt) {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid={`status-confirmed-${hospital.id}`}>
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Confirmed
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" data-testid={`status-pending-${hospital.id}`}>
      <Clock className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  );
}

function getInviteStatus(hospital: HospitalOutreach) {
  if (!hospital.whatsapp && !hospital.phone) {
    return (
      <Badge variant="outline" className="text-gray-500" data-testid={`invite-no-phone-${hospital.id}`}>
        No Phone
      </Badge>
    );
  }
  if (hospital.inviteSentAt) {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" data-testid={`invite-sent-${hospital.id}`}>
        <Send className="h-3 w-3 mr-1" />
        Sent {formatDistanceToNow(new Date(hospital.inviteSentAt), { addSuffix: true })}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" data-testid={`invite-not-sent-${hospital.id}`}>
      Ready to Send
    </Badge>
  );
}

function generatePreviewMessage(hospital: HospitalOutreach) {
  const hospitalName = hospital.nameEn || hospital.nameZh || "Hospital";
  const editLink = `https://petsos.site/hospital/edit/${hospital.slug}`;
  const code = hospital.verificationCode || "[Will be generated on send]";
  return `🏥 PetSOS Hospital Information Update

Dear ${hospitalName},

We are launching PetSOS, a non-profit pet emergency platform connecting pet owners with 24-hour veterinary clinics in Hong Kong.

Your clinic is listed on our platform. Please verify your information:

👉 ${editLink}
📋 Verification Code: ${code}

This code expires in 72 hours.

Thank you,
PetSOS Team

---

🏥 PetSOS 醫院資料更新

${hospital.nameZh || hospitalName} 您好，

我們正推出 PetSOS，一個連結寵物主人與香港24小時獸醫診所的非營利寵物急症平台。

您的診所已列於我們平台。請驗證您的資料：

👉 ${editLink}
📋 驗證碼：${code}

此驗證碼將於72小時後失效。

謝謝，
PetSOS 團隊`;
}

export default function AdminHospitalOutreachPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewHospital, setPreviewHospital] = useState<HospitalOutreach | null>(null);
  const [bulkSendDialogOpen, setBulkSendDialogOpen] = useState(false);

  const { data: hospitals, isLoading, refetch } = useQuery<HospitalOutreach[]>({
    queryKey: ["/api/admin/hospitals/outreach-status"],
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (hospitalId: string) => {
      const response = await apiRequest("POST", `/api/admin/hospitals/send-invite/${hospitalId}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation Sent",
        description: `WhatsApp invitation sent to ${data.hospital}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hospitals/outreach-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send WhatsApp invitation",
        variant: "destructive",
      });
    },
  });

  const sendAllInvitesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/hospitals/send-all-invites");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Send Complete",
        description: `Sent ${data.sent} invitations, ${data.failed} failed`,
      });
      setBulkSendDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hospitals/outreach-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Send Failed",
        description: error.message || "Could not send bulk invitations",
        variant: "destructive",
      });
    },
  });

  const filteredHospitals = hospitals?.filter((hospital) => {
    const matchesSearch =
      !searchTerm ||
      hospital.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.nameZh?.includes(searchTerm) ||
      hospital.verificationCode?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "confirmed") return matchesSearch && hospital.lastConfirmedAt;
    if (activeTab === "pending") return matchesSearch && !hospital.lastConfirmedAt;
    if (activeTab === "sent") return matchesSearch && hospital.inviteSentAt;
    if (activeTab === "not-sent") return matchesSearch && !hospital.inviteSentAt && (hospital.whatsapp || hospital.phone);
    return matchesSearch;
  });

  const stats = {
    total: hospitals?.length || 0,
    confirmed: hospitals?.filter((h) => h.lastConfirmedAt).length || 0,
    pending: hospitals?.filter((h) => !h.lastConfirmedAt).length || 0,
    sent: hospitals?.filter((h) => h.inviteSentAt).length || 0,
    canSend: hospitals?.filter((h) => !h.inviteSentAt && (h.whatsapp || h.phone) && !h.lastConfirmedAt).length || 0,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <>
      <SEO noindex={true} />
      <div className="container mx-auto py-8 px-4" data-testid="admin-hospital-outreach-page">
      <div className="mb-6">
        <Link href="/admin/hospitals" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Hospitals
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="page-title">Hospital Outreach</h1>
            <p className="text-muted-foreground">Send WhatsApp invitations to hospitals to verify their information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={bulkSendDialogOpen} onOpenChange={setBulkSendDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={stats.canSend === 0} data-testid="button-send-all">
                  <Send className="h-4 w-4 mr-2" />
                  Send to All Pending ({stats.canSend})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Bulk Send</DialogTitle>
                  <DialogDescription>
                    You are about to send WhatsApp invitations to {stats.canSend} hospitals that have not yet confirmed their information and have not received an invitation.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    This action will send bilingual (English + Chinese) WhatsApp messages to each hospital with their unique access code and instructions to update their information.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBulkSendDialogOpen(false)} data-testid="button-cancel-bulk">
                    Cancel
                  </Button>
                  <Button onClick={() => sendAllInvitesMutation.mutate()} disabled={sendAllInvitesMutation.isPending} data-testid="button-confirm-bulk">
                    {sendAllInvitesMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send to All
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Hospitals</CardDescription>
            <CardTitle className="text-2xl" data-testid="stat-total">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-2xl text-green-600" data-testid="stat-confirmed">{stats.confirmed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-600" data-testid="stat-pending">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Invites Sent</CardDescription>
            <CardTitle className="text-2xl text-blue-600" data-testid="stat-sent">{stats.sent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ready to Send</CardDescription>
            <CardTitle className="text-2xl text-orange-600" data-testid="stat-can-send">{stats.canSend}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Hospitals
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hospitals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" data-testid="tab-all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="confirmed" data-testid="tab-confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
              <TabsTrigger value="sent" data-testid="tab-sent">Invite Sent ({stats.sent})</TabsTrigger>
              <TabsTrigger value="not-sent" data-testid="tab-not-sent">Not Sent ({stats.canSend})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Verification Code</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invite Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHospitals?.map((hospital) => (
                      <TableRow key={hospital.id} data-testid={`row-hospital-${hospital.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid={`name-en-${hospital.id}`}>{hospital.nameEn || "N/A"}</div>
                            {hospital.nameZh && (
                              <div className="text-sm text-muted-foreground" data-testid={`name-zh-${hospital.id}`}>{hospital.nameZh}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {hospital.verificationCode ? (
                            <div>
                              <code className="bg-muted px-2 py-1 rounded text-sm" data-testid={`code-${hospital.id}`}>
                                {hospital.verificationCode}
                              </code>
                              {hospital.verificationCodeExpiresAt && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Expires {formatDistanceToNow(new Date(hospital.verificationCodeExpiresAt), { addSuffix: true })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Will generate on send</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {hospital.whatsapp && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3 text-green-600" />
                                <span data-testid={`whatsapp-${hospital.id}`}>{hospital.whatsapp}</span>
                              </div>
                            )}
                            {!hospital.whatsapp && hospital.phone && (
                              <div data-testid={`phone-${hospital.id}`}>{hospital.phone}</div>
                            )}
                            {!hospital.whatsapp && !hospital.phone && (
                              <span className="text-muted-foreground">No contact</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(hospital)}</TableCell>
                        <TableCell>{getInviteStatus(hospital)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewHospital(hospital)}
                                  data-testid={`button-preview-${hospital.id}`}
                                >
                                  Preview
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Message Preview</DialogTitle>
                                  <DialogDescription>
                                    This is the message that will be sent to {hospital.nameEn || hospital.nameZh}
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-[400px] mt-4">
                                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded">
                                    {generatePreviewMessage(hospital)}
                                  </pre>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              onClick={() => sendInviteMutation.mutate(hospital.id)}
                              disabled={
                                (!hospital.whatsapp && !hospital.phone) ||
                                sendInviteMutation.isPending
                              }
                              data-testid={`button-send-${hospital.id}`}
                            >
                              {sendInviteMutation.isPending ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  Send
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredHospitals?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No hospitals found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
