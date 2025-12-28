import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2, CheckCircle, XCircle, Eye, Clock, Users, FileCheck, Loader2, EyeOff } from "lucide-react";
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

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  if (phone.length <= 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

const consultantFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(['vet', 'nurse', 'practice_manager', 'other']),
  vetType: z.enum(['GP', 'Specialist', 'GP_with_interest']).optional().nullable(),
  clinicName: z.string().optional(),
  educationBackground: z.string().optional(),
  specialtyOrInterest: z.string().optional(),
  visibilityPreference: z.enum(['name_role', 'clinic_only', 'anonymous']).default('name_role'),
  internalNotes: z.string().optional(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  nameEn: z.string().optional(),
  nameZh: z.string().optional(),
  titleEn: z.string().optional(),
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
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  
  const [consultantDialogOpen, setConsultantDialogOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<VetConsultant | null>(null);
  const [deleteConsultantId, setDeleteConsultantId] = useState<string | null>(null);
  
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [deleteVerificationData, setDeleteVerificationData] = useState<{ consultantId: string; contentId: string } | null>(null);
  const [selectedVerificationConsultant, setSelectedVerificationConsultant] = useState("");
  const [selectedVerificationContent, setSelectedVerificationContent] = useState("");
  const [selectedVerificationScope, setSelectedVerificationScope] = useState("clarity");
  const [verificationAdminNote, setVerificationAdminNote] = useState("");

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
      fullName: "",
      role: "vet",
      vetType: null,
      clinicName: "",
      educationBackground: "",
      specialtyOrInterest: "",
      visibilityPreference: "name_role",
      internalNotes: "",
      isActive: true,
      isPublic: true,
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
    },
  });

  const watchRole = form.watch("role");

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
    mutationFn: async (data: { consultantId: string; contentId: string; verificationScope: string; adminNote?: string }) => {
      const response = await apiRequest('POST', '/api/admin/content-verifications', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verified-content"] });
      setVerificationDialogOpen(false);
      setSelectedVerificationConsultant("");
      setSelectedVerificationContent("");
      setSelectedVerificationScope("clarity");
      setVerificationAdminNote("");
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
      fullName: consultant.fullName || consultant.nameEn || "",
      role: (consultant.role as 'vet' | 'nurse' | 'practice_manager' | 'other') || "vet",
      vetType: consultant.vetType as 'GP' | 'Specialist' | 'GP_with_interest' | null,
      clinicName: consultant.clinicName || "",
      educationBackground: consultant.educationBackground || "",
      specialtyOrInterest: consultant.specialtyOrInterest || "",
      visibilityPreference: (consultant.visibilityPreference as 'name_role' | 'clinic_only' | 'anonymous') || "name_role",
      internalNotes: consultant.internalNotes || "",
      isActive: consultant.isActive,
      isPublic: consultant.isPublic,
      nameEn: consultant.nameEn || "",
      nameZh: consultant.nameZh || "",
      titleEn: consultant.titleEn || "",
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
    });
    setConsultantDialogOpen(true);
  };

  const openNewConsultant = () => {
    setEditingConsultant(null);
    form.reset({
      fullName: "",
      role: "vet",
      vetType: null,
      clinicName: "",
      educationBackground: "",
      specialtyOrInterest: "",
      visibilityPreference: "name_role",
      internalNotes: "",
      isActive: true,
      isPublic: true,
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
    });
    setConsultantDialogOpen(true);
  };

  const onSubmitConsultant = (data: ConsultantFormData) => {
    if (data.role !== 'vet') {
      data.vetType = null;
    }
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

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, { en: string; zh: string }> = {
      'vet': { en: 'Vet', zh: '獸醫' },
      'nurse': { en: 'Nurse', zh: '護士' },
      'practice_manager': { en: 'Practice Manager', zh: '診所經理' },
      'other': { en: 'Other', zh: '其他' },
    };
    const label = roleLabels[role] || { en: role, zh: role };
    return <Badge variant="outline">{language === 'zh-HK' ? label.zh : label.en}</Badge>;
  };

  const getVetTypeBadge = (vetType: string | null) => {
    if (!vetType) return '-';
    const typeLabels: Record<string, { en: string; zh: string }> = {
      'GP': { en: 'GP', zh: '全科' },
      'Specialist': { en: 'Specialist', zh: '專科' },
      'GP_with_interest': { en: 'GP with Interest', zh: '全科帶興趣' },
    };
    const label = typeLabels[vetType] || { en: vetType, zh: vetType };
    return <Badge variant="secondary">{language === 'zh-HK' ? label.zh : label.en}</Badge>;
  };

  const getVisibilityBadge = (visibility: string) => {
    const visibilityLabels: Record<string, { en: string; zh: string; color: string }> = {
      'name_role': { en: 'Name & Role', zh: '名稱及角色', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'clinic_only': { en: 'Clinic Only', zh: '僅顯示診所', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      'anonymous': { en: 'Anonymous', zh: '匿名', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    };
    const info = visibilityLabels[visibility] || { en: visibility, zh: visibility, color: '' };
    return <Badge variant="secondary" className={info.color}>{language === 'zh-HK' ? info.zh : info.en}</Badge>;
  };

  const getVerificationScopeBadge = (scope: string) => {
    const scopeLabels: Record<string, { en: string; zh: string; color: string }> = {
      'clarity': { en: 'Clarity', zh: '清晰度', color: 'bg-blue-100 text-blue-800' },
      'safety': { en: 'Safety', zh: '安全', color: 'bg-green-100 text-green-800' },
      'triage_language': { en: 'Triage Language', zh: '分診語言', color: 'bg-purple-100 text-purple-800' },
    };
    const info = scopeLabels[scope] || { en: scope, zh: scope, color: 'bg-gray-100 text-gray-800' };
    return <Badge variant="secondary" className={info.color}>{language === 'zh-HK' ? info.zh : info.en}</Badge>;
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
                      <TableHead>{language === 'zh-HK' ? '姓名' : 'Full Name'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '角色' : 'Role'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '獸醫類型' : 'Vet Type'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '診所' : 'Clinic'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '電話' : 'Phone'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '提交日期' : 'Submitted'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '狀態' : 'Status'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '操作' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {language === 'zh-HK' ? '暫無申請' : 'No applications yet'}
                        </TableCell>
                      </TableRow>
                    )}
                    {applications?.map((app) => (
                      <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                        <TableCell className="font-medium">{app.fullName || app.nameEn || '-'}</TableCell>
                        <TableCell>{getRoleBadge(app.role)}</TableCell>
                        <TableCell>{app.role === 'vet' ? getVetTypeBadge(app.vetType) : '-'}</TableCell>
                        <TableCell>{app.clinicName || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{maskPhone(app.phoneWhatsapp || app.phone)}</TableCell>
                        <TableCell>{formatDate(app.submittedAt || app.createdAt)}</TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedApplication(app); setViewApplicationOpen(true); setShowPhoneNumber(false); }}
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
                      <TableHead>{language === 'zh-HK' ? '角色' : 'Role'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '獸醫類型' : 'Vet Type'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '診所' : 'Clinic'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '顯示設定' : 'Visibility'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '狀態' : 'Status'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '操作' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultants?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {language === 'zh-HK' ? '暫無顧問' : 'No consultants yet'}
                        </TableCell>
                      </TableRow>
                    )}
                    {consultants?.map((consultant) => (
                      <TableRow key={consultant.id} data-testid={`row-consultant-${consultant.id}`}>
                        <TableCell className="font-medium">{consultant.fullName || (language === 'zh-HK' ? consultant.nameZh || consultant.nameEn : consultant.nameEn) || '-'}</TableCell>
                        <TableCell>{getRoleBadge(consultant.role)}</TableCell>
                        <TableCell>{consultant.role === 'vet' ? getVetTypeBadge(consultant.vetType) : '-'}</TableCell>
                        <TableCell>{consultant.clinicName || '-'}</TableCell>
                        <TableCell>{getVisibilityBadge(consultant.visibilityPreference)}</TableCell>
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
                      <TableHead>{language === 'zh-HK' ? '驗證範圍' : 'Verification Scope'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '驗證日期' : 'Verified Date'}</TableHead>
                      <TableHead>{language === 'zh-HK' ? '操作' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifiedContent?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {language === 'zh-HK' ? '暫無驗證內容' : 'No verified content yet'}
                        </TableCell>
                      </TableRow>
                    )}
                    {verifiedContent?.map((content) => (
                      <TableRow key={content.id} data-testid={`row-content-${content.id}`}>
                        <TableCell className="font-medium">{language === 'zh-HK' ? content.titleZh || content.titleEn : content.titleEn}</TableCell>
                        <TableCell>
                          {content.verification?.consultant 
                            ? (content.verification.consultant.fullName || (language === 'zh-HK' ? content.verification.consultant.nameZh || content.verification.consultant.nameEn : content.verification.consultant.nameEn))
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {content.verification?.verificationScope 
                            ? getVerificationScopeBadge(content.verification.verificationScope)
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
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {language === 'zh-HK' ? '專業資料' : 'Professional Info'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '姓名' : 'Full Name'}</label>
                    <p className="text-foreground">{selectedApplication.fullName || selectedApplication.nameEn || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '角色' : 'Role'}</label>
                    <p className="text-foreground">{getRoleBadge(selectedApplication.role)}</p>
                  </div>
                  {selectedApplication.role === 'vet' && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '獸醫類型' : 'Vet Type'}</label>
                      <p className="text-foreground">{getVetTypeBadge(selectedApplication.vetType)}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '診所' : 'Clinic'}</label>
                    <p className="text-foreground">{selectedApplication.clinicName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '電郵' : 'Email'}</label>
                    <p className="text-foreground">{selectedApplication.email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{language === 'zh-HK' ? '電話 (WhatsApp)' : 'Phone (WhatsApp)'}</label>
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-mono">
                        {showPhoneNumber 
                          ? (selectedApplication.phoneWhatsapp || selectedApplication.phone || '-')
                          : maskPhone(selectedApplication.phoneWhatsapp || selectedApplication.phone)
                        }
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPhoneNumber(!showPhoneNumber)}
                        data-testid="button-toggle-phone"
                      >
                        {showPhoneNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {language === 'zh-HK' ? '教育背景' : 'Education Background'}
                </h3>
                <p className="text-foreground">{selectedApplication.educationBackground || '-'}</p>
              </div>

              {selectedApplication.verificationScope && selectedApplication.verificationScope.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {language === 'zh-HK' ? '驗證範圍' : 'Verification Scope'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.verificationScope.map((scope, idx) => (
                      <Badge key={idx} variant="secondary">{scope}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplication.futureContactInterest && selectedApplication.futureContactInterest.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {language === 'zh-HK' ? '未來聯繫興趣' : 'Future Contact Interest'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.futureContactInterest.map((interest, idx) => (
                      <Badge key={idx} variant="outline">{interest}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplication.additionalComments && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {language === 'zh-HK' ? '附加評論' : 'Additional Comments'}
                  </h3>
                  <p className="text-foreground whitespace-pre-wrap">{selectedApplication.additionalComments}</p>
                </div>
              )}

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
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'zh-HK' ? '全名 *' : 'Full Name *'}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-fullname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'zh-HK' ? '角色 *' : 'Role *'}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder={language === 'zh-HK' ? '選擇角色' : 'Select role'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vet">{language === 'zh-HK' ? '獸醫' : 'Vet'}</SelectItem>
                          <SelectItem value="nurse">{language === 'zh-HK' ? '護士' : 'Nurse'}</SelectItem>
                          <SelectItem value="practice_manager">{language === 'zh-HK' ? '診所經理' : 'Practice Manager'}</SelectItem>
                          <SelectItem value="other">{language === 'zh-HK' ? '其他' : 'Other'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchRole === 'vet' && (
                  <FormField
                    control={form.control}
                    name="vetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'zh-HK' ? '獸醫類型' : 'Vet Type'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-vet-type">
                              <SelectValue placeholder={language === 'zh-HK' ? '選擇類型' : 'Select type'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GP">{language === 'zh-HK' ? '全科' : 'GP'}</SelectItem>
                            <SelectItem value="Specialist">{language === 'zh-HK' ? '專科' : 'Specialist'}</SelectItem>
                            <SelectItem value="GP_with_interest">{language === 'zh-HK' ? '全科帶興趣' : 'GP with Interest'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <FormField
                control={form.control}
                name="clinicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'zh-HK' ? '診所名稱' : 'Clinic Name'}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-clinic" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="educationBackground"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'zh-HK' ? '教育背景' : 'Education Background'}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., BVSc, DVM, VN Diploma" data-testid="input-education" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialtyOrInterest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'zh-HK' ? '專長或興趣' : 'Specialty or Interest'}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-specialty" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visibilityPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'zh-HK' ? '顯示偏好' : 'Visibility Preference'}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-visibility">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="name_role">{language === 'zh-HK' ? '顯示名稱及角色' : 'Name & Role'}</SelectItem>
                        <SelectItem value="clinic_only">{language === 'zh-HK' ? '僅顯示診所' : 'Clinic Only'}</SelectItem>
                        <SelectItem value="anonymous">{language === 'zh-HK' ? '匿名' : 'Anonymous'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'zh-HK' ? '內部備註 (僅管理員可見)' : 'Internal Notes (Admin only)'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-internal-notes" />
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
                      {c.fullName || (language === 'zh-HK' ? c.nameZh || c.nameEn : c.nameEn)}
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
            <div>
              <label className="text-sm font-medium mb-2 block">{language === 'zh-HK' ? '驗證範圍' : 'Verification Scope'}</label>
              <Select value={selectedVerificationScope} onValueChange={setSelectedVerificationScope}>
                <SelectTrigger data-testid="select-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clarity">{language === 'zh-HK' ? '清晰度' : 'Clarity'}</SelectItem>
                  <SelectItem value="safety">{language === 'zh-HK' ? '安全' : 'Safety'}</SelectItem>
                  <SelectItem value="triage_language">{language === 'zh-HK' ? '分診語言' : 'Triage Language'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{language === 'zh-HK' ? '管理員備註 (選填)' : 'Admin Note (optional)'}</label>
              <Textarea 
                value={verificationAdminNote} 
                onChange={(e) => setVerificationAdminNote(e.target.value)}
                placeholder={language === 'zh-HK' ? '備註...' : 'Notes...'}
                data-testid="input-admin-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationDialogOpen(false)}>
              {language === 'zh-HK' ? '取消' : 'Cancel'}
            </Button>
            <Button
              onClick={() => createVerificationMutation.mutate({ 
                consultantId: selectedVerificationConsultant, 
                contentId: selectedVerificationContent,
                verificationScope: selectedVerificationScope,
                adminNote: verificationAdminNote || undefined
              })}
              disabled={!selectedVerificationConsultant || !selectedVerificationContent || createVerificationMutation.isPending}
              data-testid="button-submit-verification"
            >
              {createVerificationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'zh-HK' ? '確認' : 'Confirm'}
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
