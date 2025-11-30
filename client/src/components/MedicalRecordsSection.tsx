import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { ObjectUploader } from "./ObjectUploader";
import { FileText, Upload, Trash2, Download, Shield, AlertCircle } from "lucide-react";
import type { PetMedicalRecord, PetMedicalSharingConsent } from "@shared/schema";

interface MedicalRecordsSectionProps {
  petId: string;
  petName: string;
}

const DOCUMENT_TYPES = [
  { value: "blood_test", labelEn: "Blood Test", labelZh: "血液檢查" },
  { value: "xray", labelEn: "X-Ray", labelZh: "X光" },
  { value: "vaccination", labelEn: "Vaccination Record", labelZh: "疫苗記錄" },
  { value: "surgery_report", labelEn: "Surgery Report", labelZh: "手術報告" },
  { value: "prescription", labelEn: "Prescription", labelZh: "處方" },
  { value: "other", labelEn: "Other Document", labelZh: "其他文件" },
];

export function MedicalRecordsSection({ petId, petName }: MedicalRecordsSectionProps) {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState({
    title: "",
    documentType: "other",
    description: "",
  });
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>("");

  const { data: records = [], isLoading: recordsLoading } = useQuery<PetMedicalRecord[]>({
    queryKey: ['/api/pets', petId, 'medical-records'],
  });

  const { data: consents = [] } = useQuery<PetMedicalSharingConsent[]>({
    queryKey: ['/api/pets', petId, 'medical-consents'],
  });

  const emergencyConsent = consents.find(c => c.consentType === 'emergency_broadcast');

  const createRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/medical-records', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pets', petId, 'medical-records'] });
      setIsUploadDialogOpen(false);
      setNewRecord({ title: "", documentType: "other", description: "" });
      setUploadedFilePath(null);
      toast({
        title: language === 'zh-HK' ? "記錄已上傳" : "Record Uploaded",
        description: language === 'zh-HK' ? "醫療記錄已成功儲存" : "Medical record saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'zh-HK' ? "上傳失敗" : "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/medical-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pets', petId, 'medical-records'] });
      setDeletingRecordId(null);
      toast({
        title: language === 'zh-HK' ? "記錄已刪除" : "Record Deleted",
      });
    },
  });

  const updateConsentMutation = useMutation({
    mutationFn: async (data: { consentType: string; enabled: boolean }) => {
      const response = await apiRequest('PUT', `/api/pets/${petId}/medical-consents`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pets', petId, 'medical-consents'] });
      toast({
        title: language === 'zh-HK' ? "設定已更新" : "Settings Updated",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest('POST', '/api/medical-records/upload-url');
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      setUploadedFilePath(file.uploadURL);
      setUploadedFileSize(file.size);
      setUploadedMimeType(file.type);
    }
  };

  const handleSaveRecord = () => {
    if (!uploadedFilePath || !newRecord.title) {
      toast({
        title: language === 'zh-HK' ? "請填寫必要資料" : "Please fill required fields",
        description: language === 'zh-HK' ? "需要標題和文件" : "Title and file are required",
        variant: "destructive",
      });
      return;
    }

    createRecordMutation.mutate({
      petId,
      title: newRecord.title,
      documentType: newRecord.documentType,
      description: newRecord.description,
      filePath: uploadedFilePath,
      fileSize: uploadedFileSize,
      mimeType: uploadedMimeType,
      isConfidential: false,
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = DOCUMENT_TYPES.find(d => d.value === type);
    return docType ? (language === 'zh-HK' ? docType.labelZh : docType.labelEn) : type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Accordion type="single" collapsible className="mt-4">
      <AccordionItem value="medical-records" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline" data-testid={`accordion-medical-records-${petId}`}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{language === 'zh-HK' ? '醫療記錄' : 'Medical Records'}</span>
            <span className="text-sm text-gray-500">({records.length})</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {/* Emergency Sharing Consent */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <Label htmlFor={`consent-${petId}`} className="text-sm font-medium">
                  {language === 'zh-HK' ? '緊急情況時分享醫療記錄' : 'Share records during emergencies'}
                </Label>
              </div>
              <Switch
                id={`consent-${petId}`}
                checked={emergencyConsent?.enabled ?? false}
                onCheckedChange={(checked) => {
                  updateConsentMutation.mutate({ consentType: 'emergency_broadcast', enabled: checked });
                }}
                data-testid={`switch-emergency-consent-${petId}`}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {language === 'zh-HK' 
                ? '啟用後，您的寵物醫療記錄會在緊急廣播時自動分享給醫院' 
                : 'When enabled, medical records will be shared with hospitals during emergency broadcasts'}
            </p>
          </div>

          {/* Upload Button */}
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mb-4" data-testid={`button-upload-record-${petId}`}>
                <Upload className="w-4 h-4 mr-2" />
                {language === 'zh-HK' ? '上傳記錄' : 'Upload Record'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {language === 'zh-HK' ? `上傳 ${petName} 的醫療記錄` : `Upload Medical Record for ${petName}`}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{language === 'zh-HK' ? '標題' : 'Title'} *</Label>
                  <Input
                    value={newRecord.title}
                    onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                    placeholder={language === 'zh-HK' ? '例如：2024年12月血液檢查' : 'e.g., Blood Test Dec 2024'}
                    data-testid="input-record-title"
                  />
                </div>
                <div>
                  <Label>{language === 'zh-HK' ? '文件類型' : 'Document Type'}</Label>
                  <Select
                    value={newRecord.documentType}
                    onValueChange={(value) => setNewRecord({ ...newRecord, documentType: value })}
                  >
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === 'zh-HK' ? type.labelZh : type.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'zh-HK' ? '備註（選填）' : 'Notes (Optional)'}</Label>
                  <Input
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    placeholder={language === 'zh-HK' ? '任何額外說明...' : 'Any additional notes...'}
                    data-testid="input-record-description"
                  />
                </div>
                <div>
                  <Label>{language === 'zh-HK' ? '文件' : 'File'} *</Label>
                  <div className="mt-2">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      allowedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', 'image/*', 'application/pdf']}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadedFilePath 
                        ? (language === 'zh-HK' ? '已選擇文件 ✓' : 'File Selected ✓')
                        : (language === 'zh-HK' ? '選擇文件' : 'Select File')}
                    </ObjectUploader>
                  </div>
                  {uploadedFilePath && (
                    <p className="text-xs text-green-600 mt-1">
                      {language === 'zh-HK' ? `文件大小: ${formatFileSize(uploadedFileSize)}` : `File size: ${formatFileSize(uploadedFileSize)}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsUploadDialogOpen(false);
                      setNewRecord({ title: "", documentType: "other", description: "" });
                      setUploadedFilePath(null);
                    }}
                  >
                    {language === 'zh-HK' ? '取消' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleSaveRecord}
                    disabled={createRecordMutation.isPending || !uploadedFilePath || !newRecord.title}
                    data-testid="button-save-record"
                  >
                    {createRecordMutation.isPending
                      ? (language === 'zh-HK' ? '儲存中...' : 'Saving...')
                      : (language === 'zh-HK' ? '儲存記錄' : 'Save Record')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Records List */}
          {recordsLoading ? (
            <div className="text-center py-4 text-gray-500">
              {language === 'zh-HK' ? '載入中...' : 'Loading...'}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{language === 'zh-HK' ? '尚無醫療記錄' : 'No medical records yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  data-testid={`record-item-${record.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{record.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{getDocumentTypeLabel(record.documentType)}</span>
                      <span>•</span>
                      <span>{formatFileSize(record.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(record.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(record.filePath, '_blank')}
                      data-testid={`button-download-record-${record.id}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingRecordId(record.id)}
                      data-testid={`button-delete-record-${record.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRecordId} onOpenChange={() => setDeletingRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'zh-HK' ? '刪除記錄' : 'Delete Record'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'zh-HK' 
                ? '確定要刪除這份醫療記錄嗎？此操作無法撤銷。'
                : 'Are you sure you want to delete this medical record? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'zh-HK' ? '取消' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRecordId && deleteRecordMutation.mutate(deletingRecordId)}
              className="bg-red-500 hover:bg-red-600"
            >
              {language === 'zh-HK' ? '刪除' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Accordion>
  );
}
