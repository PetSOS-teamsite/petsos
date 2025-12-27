import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2, CheckCircle, XCircle, Eye, Clock, Users, FileCheck, Stethoscope, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import type { VetApplication, VetConsultant, VerifiedContentItem, ContentVerification } from "@shared/schema";

const consultantFormSchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameZh: z.string().optional(),
  titleEn: z.string().min(1, "Title is required"),
  titleZh: z.string().optional(),
  specialtyEn: z.string().optional(),
  specialtyZh: z.string().optional(),
  bioEn: z.string().optional(),
  bioZh: z.string().optional(),
  photoUrl: z.string().optional(),
  licenseNumber: z.string().optional(),
  hospitalAffiliationEn: z.string().optional(),
  hospitalAffiliationZh: z.string().optional(),
  yearsExperience: z.coerce.number().optional(),
  email: z.string().email().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
});

type ConsultantFormData = z.infer<typeof consultantFormSchema>;

type VerifiedContentWithVerifier = VerifiedContentItem & {
  verification?: ContentVerification & { consultant?: VetConsultant };
};

export default function AdminConsultantsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("applications");
  
  const [selectedApplication, setSelectedApplication] = useState<VetApplication | null>(null);
  const [viewApplicationOpen, setViewApplicationOpen] = useState(false);
  
  const [consultantDialogOpen, setConsultantDialogOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<VetConsultant | null>(null);
  const [deleteConsultantId, setDeleteConsultantId] = useState<string | null>(null);
  
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [deleteVerificationData, setDeleteVerificationData] = useState<{ consultantId: string; contentId: string } | null>(null);
  const [selectedVerificationConsultant, setSelectedVerificationConsultant] = useState("");
  const [selectedVerificationContent, setSelectedVerificationContent] = useState("");

  const { data: applications, isLoading: applicationsLoading } = useQuery<VetApplication[]>({
    queryKey: ["/api/admin/vet-applications"],
  });

  const { data: consultants, isLoading: consultantsLoading } = useQuery<VetConsultant[]>({
    queryKey: ["/api/consultants"],
  });

  const { data: verifiedContent, isLoading: contentLoading } = useQuery<VerifiedContentWithVerifier[]>({
    queryKey: ["/api/admin/verified-content"],
  });

  const form = useForm<ConsultantFormData>({
    resolver: zodResolver(consultantFormSchema),
    defaultValues: {
      nameEn: "",
      nameZh: "",
      titleEn: "",
      titleZh: "",
      specialtyEn: "",
      specialtyZh: "",
      bioEn: "",
      bioZh: "",
      photoUrl: "",
      licenseNumber: "",
      hospitalAffiliationEn: "",
      hospitalAffiliationZh: "",
      yearsExperience: undefined,
      email: "",
      isActive: true,
      isPublic: true,
    },
  });

  const approveApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/admin/vet-applications/${id}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vet-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      toast({ title: language === 'zh-HK' ? "申請已批准" : "Application approved" });
    },
    onError: (error: any) => {
      toast({ title: language === 'zh-HK' ? "批准失敗" : "Failed to approve", description: error.message, variant: "destructive" });
    },
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/admin/vet-applications/${id}/status`, { status: 'rejected' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vet-applications"] });
      toast({ title: language === 'zh-HK' ? "申請已拒絕" : "Application rejected" });
    },
    onError: (error: any) => {
      toast({ title: language === 'zh-HK' ? "拒絕失敗" : "Failed to reject", description: error.message, variant: "destructive" });
    },
  });

  const createConsultantMutation = useMutation({
    mutationFn: async (data: ConsultantFormData) => {
      const response = await apiRequest('POST', '/api/admin/consultants', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      setConsultantDialogOpen(false);
      form.reset();
      toast({ title: language === 'zh-HK' ? "顧問已創建" : "Consultant created" });
    },
    onError: (error: any) => {
      toast({ title: language === 'zh-HK' ? "創建失敗" : "Failed to create", description: error.message, variant: "destructive" });
    },
  });

  const updateConsultantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConsultantFormData }) => {
      const response = await apiRequest('PATCH', `/api/admin/consultants/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      setConsultantDialogOpen(false);
      setEditingConsultant(null);
      form.reset();
      toast({ title: language === 'zh-HK' ? "顧問已更新" : "Consultant updated" });
    },
    onError: (error: any) => {
      toast({ title: language === 'zh-HK' ? "更新失敗" : "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const deleteConsultantMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/consultants/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      setDeleteConsultantId(null);
      toast({ title: language === 'zh-HK' ? "顧問已刪除" : "Consultant deleted" });
    },
    onError: (error: any) => {
      toast({ title: language === 'zh-HK' ? "刪除失敗" : "Failed to delete", description: error.message, variant: "destructive" });
    },
  });

  const createVerificationMutation = useMutation({
    mutationFn: async (data: { consultantId: string; contentId: string }) => {
      const response = await apiRequest('POST', '/api/admin/content-verifications', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verified-content"] });
      setVerificationDialogOpen(false);
      setSelectedVerificationConsultant("");
      setSelectedVerificationContent("");
      toast({ title: language === 'zh-HK' ? "驗證已添加" : "Verification added" });
    },
    onError: (error: any) => {
      toast({ title: language === 'zh-HK' ? "添加失敗" : "Failed to add", description: error.message, variant: "destructive" });
    },
  });

  const deleteVerificationMutation = useMutation({
    mutationFn: async ({ consultantId, contentId }: { consultantId: string; contentId: string }) => {
      const response = await apiRequest('DELETE', `/api/admin/content-verifications/${consultantId}/${contentId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verified-content"] });
      setDeleteVerificationData(null);
      toast({ title: language === 'zh-HK' ? "驗證已移除" : "Verification removed" });
    },
    onError: (error: any) => {
      toast({ title: language === 'zh-HK' ? "移除失敗" : "Failed to remove", description: error.message, variant: "destructive" });
    },
  });

  const openEditConsultant = (consultant: VetConsultant) => {
    setEditingConsultant(consultant);
    form.reset({
      nameEn: consultant.nameEn,
      nameZh: consultant.nameZh || "",
      titleEn: consultant.titleEn,
      titleZh: consultant.titleZh || "",
      specialtyEn: consultant.specialtyEn || "",
      specialtyZh: consultant.specialtyZh || "",
      bioEn: consultant.bioEn || "",
      bioZh: consultant.bioZh || "",
      photoUrl: consultant.photoUrl || "",
      licenseNumber: consultant.licenseNumber || "",
      hospitalAffiliationEn: consultant.hospitalAffiliationEn || "",
      hospitalAffiliationZh: consultant.hospitalAffiliationZh || "",
      yearsExperience: consultant.yearsExperience || undefined,
      email: consultant.email || "",
      isActive: consultant.isActive,
      isPublic: consultant.isPublic,
    });
    setConsultantDialogOpen(true);
  };

  const openNewConsultant = () => {
    setEditingConsultant(null);
    form.reset({
      nameEn: "",
      nameZh: "",
      titleEn: "",
      titleZh: "",
      specialtyEn: "",
      specialtyZh: "",
      bioEn: "",
      bioZh: "",
      photoUrl: "",
      licenseNumber: "",
      hospitalAffiliationEn: "",
      hospitalAffiliationZh: "",
      yearsExperience: undefined,
      email: "",
      isActive: true,
      isPublic: true,
    });
    setConsultantDialogOpen(true);
  };

  const onSubmitConsultant = (data: ConsultantFormData) => {
    if (editingConsultant) {
      updateConsultantMutation.mutate({ id: editingConsultant.id, data });
    } else {
      createConsultantMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />{language === 'zh-HK' ? '待審核' : 'Pending'}</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />{language === 'zh-HK' ? '已批准' : 'Approved'}</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />{language === 'zh-HK' ? '已拒絕' : 'Rejected'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'yyyy-MM-dd');
    } catch {
      return '-';
    }
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                  {language === 'zh-HK' ? '獸醫顧問管理' : 'Vet Consultant Management'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'zh-HK' ? '管理申請、顧問和內容驗證' : 'Manage applications, consultants and content verifications'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="applications" className="flex items-center gap-2" data-testid="tab-applications">
              <Clock className="h-4 w-4" />
              {language === 'zh-HK' ? '申請' : 'Applications'}
            </TabsTrigger>
            <TabsTrigger value="consultants" className="flex items-center gap-2" data-testid="tab-consultants">
              <Users className="h-4 w-4" />
              {language === 'zh-HK' ? '顧問' : 'Consultants'}
            </TabsTrigger>
            <TabsTrigger value="verifications" className="flex items-center gap-2" data-testid="tab-verifications">
              <FileCheck className="h-4 w-4" />
              {language === 'zh-HK' ? '內容驗證' : 'Content Verification'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold" data-testid="text-applications-title">
                  {language === 'zh-HK' ? '顧問申請' : 'Consultant Applications'}
                </h2>
              </div>
              {applicationsLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'zh-HK' ? '姓名' : 'Name'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '電郵' : 'Email'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '執照號碼' : 'License #'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '經驗年資' : 'Years Exp'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '狀態' : 'Status'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '申請日期' : 'Applied Date'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '操作' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {language === 'zh-HK' ? '暫無申請' : 'No applications yet'}
                        </TableCell>
                      </TableRow>
                    )}
                    {applications?.map((app) => (
                      <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                        <TableCell className="font-medium">{language === 'zh-HK' ? app.nameZh || app.nameEn : app.nameEn}</TableCell>
                        <TableCell>{app.email}</TableCell>
                        <TableCell>{app.licenseNumber}</TableCell>
                        <TableCell>{app.yearsExperience}</TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>{formatDate(app.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedApplication(app); setViewApplicationOpen(true); }}
                              data-testid={`button-view-${app.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {app.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => approveApplicationMutation.mutate(app.id)}
                                  disabled={approveApplicationMutation.isPending}
                                  data-testid={`button-approve-${app.id}`}
                                >
                                  {approveApplicationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => rejectApplicationMutation.mutate(app.id)}
                                  disabled={rejectApplicationMutation.isPending}
                                  data-testid={`button-reject-${app.id}`}
                                >
                                  {rejectApplicationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="consultants">
            <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold" data-testid="text-consultants-title">
                  {language === 'zh-HK' ? '顧問列表' : 'Consultant List'}
                </h2>
                <Button onClick={openNewConsultant} data-testid="button-add-consultant">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'zh-HK' ? '新增顧問' : 'Add New Consultant'}
                </Button>
              </div>
              {consultantsLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'zh-HK' ? '姓名' : 'Name'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '職銜' : 'Title'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '專長' : 'Specialty'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '執照號碼' : 'License #'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '狀態' : 'Active'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '操作' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultants?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {language === 'zh-HK' ? '暫無顧問' : 'No consultants yet'}
                        </TableCell>
                      </TableRow>
                    )}
                    {consultants?.map((consultant) => (
                      <TableRow key={consultant.id} data-testid={`row-consultant-${consultant.id}`}>
                        <TableCell className="font-medium">{language === 'zh-HK' ? consultant.nameZh || consultant.nameEn : consultant.nameEn}</TableCell>
                        <TableCell>{language === 'zh-HK' ? consultant.titleZh || consultant.titleEn : consultant.titleEn}</TableCell>
                        <TableCell>{language === 'zh-HK' ? consultant.specialtyZh || consultant.specialtyEn || '-' : consultant.specialtyEn || '-'}</TableCell>
                        <TableCell>{consultant.licenseNumber || '-'}</TableCell>
                        <TableCell>
                          {consultant.isActive ? (
                            <Badge className="bg-green-100 text-green-800">{language === 'zh-HK' ? '啟用' : 'Active'}</Badge>
                          ) : (
                            <Badge variant="secondary">{language === 'zh-HK' ? '停用' : 'Inactive'}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditConsultant(consultant)}
                              data-testid={`button-edit-${consultant.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDeleteConsultantId(consultant.id)}
                              data-testid={`button-delete-${consultant.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="verifications">
            <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold" data-testid="text-verifications-title">
                  {language === 'zh-HK' ? '內容驗證' : 'Content Verifications'}
                </h2>
                <Button onClick={() => setVerificationDialogOpen(true)} data-testid="button-add-verification">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'zh-HK' ? '新增驗證' : 'Add Verification'}
                </Button>
              </div>
              {contentLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'zh-HK' ? '內容標題' : 'Content Title'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '驗證者' : 'Verified By'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '驗證日期' : 'Verified Date'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '操作' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifiedContent?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {language === 'zh-HK' ? '暫無驗證內容' : 'No verified content yet'}
                        </TableCell>
                      </TableRow>
                    )}
                    {verifiedContent?.map((content) => (
                      <TableRow key={content.id} data-testid={`row-content-${content.id}`}>
                        <TableCell className="font-medium">{language === 'zh-HK' ? content.titleZh || content.titleEn : content.titleEn}</TableCell>
                        <TableCell>
                          {content.verification?.consultant 
                            ? (language === 'zh-HK' ? content.verification.consultant.nameZh || content.verification.consultant.nameEn : content.verification.consultant.nameEn)
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{content.verification ? formatDate(content.verification.verifiedAt) : '-'}</TableCell>
                        <TableCell>
                          {content.verification && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDeleteVerificationData({ consultantId: content.verification!.consultantId, contentId: content.id })}
                              data-testid={`button-remove-verification-${content.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={viewApplicationOpen} onOpenChange={setViewApplicationOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === 'zh-HK' ? '申請詳情' : 'Application Details'}</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '姓名 (英文)' : 'Name (English)'}</label>
                  <p className="text-foreground">{selectedApplication.nameEn}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '姓名 (中文)' : 'Name (Chinese)'}</label>
                  <p className="text-foreground">{selectedApplication.nameZh || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '電郵' : 'Email'}</label>
                  <p className="text-foreground">{selectedApplication.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '電話' : 'Phone'}</label>
                  <p className="text-foreground">{selectedApplication.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '執照號碼' : 'License Number'}</label>
                  <p className="text-foreground">{selectedApplication.licenseNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '經驗年資' : 'Years Experience'}</label>
                  <p className="text-foreground">{selectedApplication.yearsExperience}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '職銜' : 'Title'}</label>
                  <p className="text-foreground">{selectedApplication.titleEn || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '專長' : 'Specialty'}</label>
                  <p className="text-foreground">{selectedApplication.specialtyEn || '-'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '醫院隸屬' : 'Hospital Affiliation'}</label>
                  <p className="text-foreground">{selectedApplication.hospitalAffiliationEn || '-'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '申請動機' : 'Motivation'}</label>
                  <p className="text-foreground whitespace-pre-wrap">{selectedApplication.motivationEn || '-'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-sm text-muted-foreground mr-2">{language === 'zh-HK' ? '狀態:' : 'Status:'}</span>
                  {getStatusBadge(selectedApplication.status)}
                </div>
                {selectedApplication.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="text-green-600"
                      onClick={() => { approveApplicationMutation.mutate(selectedApplication.id); setViewApplicationOpen(false); }}
                      disabled={approveApplicationMutation.isPending}
                      data-testid="button-approve-modal"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {language === 'zh-HK' ? '批准' : 'Approve'}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600"
                      onClick={() => { rejectApplicationMutation.mutate(selectedApplication.id); setViewApplicationOpen(false); }}
                      disabled={rejectApplicationMutation.isPending}
                      data-testid="button-reject-modal"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {language === 'zh-HK' ? '拒絕' : 'Reject'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={consultantDialogOpen} onOpenChange={(open) => { setConsultantDialogOpen(open); if (!open) { setEditingConsultant(null); form.reset(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConsultant 
                ? (language === 'zh-HK' ? '編輯顧問' : 'Edit Consultant')
                : (language === 'zh-HK' ? '新增顧問' : 'Add New Consultant')
              }
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitConsultant)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '姓名 (英文) *' : 'Name (English) *'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-name-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameZh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '姓名 (中文)' : 'Name (Chinese)'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-name-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="titleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '職銜 (英文) *' : 'Title (English) *'}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DVM, DACVECC" data-testid="input-title-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="titleZh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '職銜 (中文)' : 'Title (Chinese)'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-title-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialtyEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '專長 (英文)' : 'Specialty (English)'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-specialty-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialtyZh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '專長 (中文)' : 'Specialty (Chinese)'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-specialty-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '執照號碼' : 'License Number'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-license" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '經驗年資' : 'Years Experience'}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-years" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hospitalAffiliationEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '醫院隸屬 (英文)' : 'Hospital Affiliation (English)'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-hospital-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hospitalAffiliationZh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '醫院隸屬 (中文)' : 'Hospital Affiliation (Chinese)'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-hospital-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '電郵' : 'Email'}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '照片網址' : 'Photo URL'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-photo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bioEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'zh-HK' ? '簡介 (英文)' : 'Bio (English)'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-bio-en" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bioZh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'zh-HK' ? '簡介 (中文)' : 'Bio (Chinese)'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-bio-zh" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel>{language === 'zh-HK' ? '啟用' : 'Active'}</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel>{language === 'zh-HK' ? '公開顯示' : 'Public'}</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-public" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setConsultantDialogOpen(false)}>
                  {language === 'zh-HK' ? '取消' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createConsultantMutation.isPending || updateConsultantMutation.isPending}
                  data-testid="button-submit-consultant"
                >
                  {(createConsultantMutation.isPending || updateConsultantMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingConsultant 
                    ? (language === 'zh-HK' ? '更新' : 'Update')
                    : (language === 'zh-HK' ? '創建' : 'Create')
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConsultantId} onOpenChange={() => setDeleteConsultantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'zh-HK' ? '確認刪除' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'zh-HK' 
                ? '確定要刪除此顧問嗎？此操作無法撤銷。'
                : 'Are you sure you want to delete this consultant? This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'zh-HK' ? '取消' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConsultantId && deleteConsultantMutation.mutate(deleteConsultantId)}
              data-testid="button-confirm-delete"
            >
              {deleteConsultantMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'zh-HK' ? '刪除' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'zh-HK' ? '新增內容驗證' : 'Add Content Verification'}</DialogTitle>
            <DialogDescription>
              {language === 'zh-HK' 
                ? '選擇顧問和要驗證的內容'
                : 'Select a consultant and content to verify'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{language === 'zh-HK' ? '顧問' : 'Consultant'}</label>
              <Select value={selectedVerificationConsultant} onValueChange={setSelectedVerificationConsultant}>
                <SelectTrigger data-testid="select-consultant">
                  <SelectValue placeholder={language === 'zh-HK' ? '選擇顧問' : 'Select consultant'} />
                </SelectTrigger>
                <SelectContent>
                  {consultants?.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {language === 'zh-HK' ? c.nameZh || c.nameEn : c.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{language === 'zh-HK' ? '內容' : 'Content'}</label>
              <Select value={selectedVerificationContent} onValueChange={setSelectedVerificationContent}>
                <SelectTrigger data-testid="select-content">
                  <SelectValue placeholder={language === 'zh-HK' ? '選擇內容' : 'Select content'} />
                </SelectTrigger>
                <SelectContent>
                  {verifiedContent?.filter(c => !c.verification).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {language === 'zh-HK' ? c.titleZh || c.titleEn : c.titleEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationDialogOpen(false)}>
              {language === 'zh-HK' ? '取消' : 'Cancel'}
            </Button>
            <Button
              onClick={() => createVerificationMutation.mutate({ consultantId: selectedVerificationConsultant, contentId: selectedVerificationContent })}
              disabled={!selectedVerificationConsultant || !selectedVerificationContent || createVerificationMutation.isPending}
              data-testid="button-submit-verification"
            >
              {createVerificationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'zh-HK' ? '添加' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteVerificationData} onOpenChange={() => setDeleteVerificationData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'zh-HK' ? '確認移除驗證' : 'Confirm Remove Verification'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'zh-HK' 
                ? '確定要移除此內容驗證嗎？'
                : 'Are you sure you want to remove this content verification?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'zh-HK' ? '取消' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteVerificationData && deleteVerificationMutation.mutate(deleteVerificationData)}
              data-testid="button-confirm-remove-verification"
            >
              {deleteVerificationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'zh-HK' ? '移除' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
