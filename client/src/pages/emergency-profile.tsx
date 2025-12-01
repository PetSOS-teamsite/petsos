import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Phone, MapPin, Clock, FileText, Heart, PawPrint, User, ExternalLink, Download, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SEO } from "@/components/SEO";

interface EmergencyRequest {
  id: string;
  symptom: string;
  manualLocation: string | null;
  contactName: string;
  contactPhone: string;
  petSpecies: string | null;
  petBreed: string | null;
  petAge: number | null;
  status: string;
  createdAt: string;
  pet?: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    age: number | null;
    weight: string | null;
    medicalNotes: string | null;
    allergies: string | null;
    medications: string | null;
    microchipId: string | null;
  };
  medicalRecords?: {
    id: string;
    title: string;
    documentType: string;
    description: string | null;
    fileUrl: string;
    createdAt: string;
  }[];
  medicalSharingEnabled?: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<string, { en: string; zh: string }> = {
  'blood_test': { en: 'Blood Test', zh: '血液檢查' },
  'xray': { en: 'X-Ray', zh: 'X光' },
  'vaccination': { en: 'Vaccination', zh: '疫苗記錄' },
  'surgery_report': { en: 'Surgery Report', zh: '手術報告' },
  'prescription': { en: 'Prescription', zh: '處方' },
  'other': { en: 'Document', zh: '文件' },
};

export default function EmergencyProfilePage() {
  const { t, language } = useTranslation();
  const [, params] = useRoute("/emergency-profile/:requestId");
  
  const { data: emergencyRequest, isLoading, error } = useQuery<EmergencyRequest>({
    queryKey: [`/api/emergency-requests/${params?.requestId}/profile`],
    enabled: !!params?.requestId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
      </div>
    );
  }

  if (error || !emergencyRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Card className="border-red-200">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {t('emergency_profile.not_found', 'Emergency Request Not Found')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('emergency_profile.not_found_desc', 'This emergency profile link may be expired or invalid.')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'zh-HK' ? 'zh-HK' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels = DOCUMENT_TYPE_LABELS[type] || DOCUMENT_TYPE_LABELS['other'];
    return language === 'zh-HK' ? labels.zh : labels.en;
  };

  return (
    <>
      <SEO
        title={language === 'zh-HK' ? '緊急求助檔案 - PetSOS' : 'Emergency Profile - PetSOS'}
        description={language === 'zh-HK' ? '寵物緊急求助詳情及醫療記錄' : 'Pet emergency request details and medical records'}
        language={language}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-2xl mx-auto pt-4 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h1 className="text-2xl font-bold text-red-600">PetSOS</h1>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Emergency Alert Banner */}
          <Card className="border-red-500 bg-red-50 dark:bg-red-950 mb-6">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-red-800 dark:text-red-200 text-lg">
                    {t('emergency_profile.emergency_alert', 'Emergency Pet Care Request')}
                  </h2>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {formatDate(emergencyRequest.createdAt)}
                  </p>
                </div>
                <Badge variant={emergencyRequest.status === 'pending' ? 'destructive' : 'default'} className="ml-auto">
                  {emergencyRequest.status === 'pending' 
                    ? (language === 'zh-HK' ? '待處理' : 'Pending')
                    : (language === 'zh-HK' ? '已處理' : 'Resolved')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Symptoms */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                {t('emergency_profile.symptoms', 'Symptoms')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {emergencyRequest.symptom}
              </p>
            </CardContent>
          </Card>

          {/* Pet Information */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-blue-500" />
                {t('emergency_profile.pet_info', 'Pet Information')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {emergencyRequest.pet ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.name', 'Name')}</p>
                      <p className="font-semibold">{emergencyRequest.pet.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.species', 'Species')}</p>
                      <p className="font-semibold">{emergencyRequest.pet.species || emergencyRequest.petSpecies}</p>
                    </div>
                    {emergencyRequest.pet.breed && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.breed', 'Breed')}</p>
                        <p className="font-semibold">{emergencyRequest.pet.breed}</p>
                      </div>
                    )}
                    {(emergencyRequest.pet.age || emergencyRequest.petAge) && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.age', 'Age')}</p>
                        <p className="font-semibold">{emergencyRequest.pet.age || emergencyRequest.petAge} {t('common.years', 'years')}</p>
                      </div>
                    )}
                    {emergencyRequest.pet.weight && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.weight', 'Weight')}</p>
                        <p className="font-semibold">{emergencyRequest.pet.weight} kg</p>
                      </div>
                    )}
                    {emergencyRequest.pet.microchipId && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.microchip', 'Microchip')}</p>
                        <p className="font-semibold text-sm">{emergencyRequest.pet.microchipId}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Medical Notes */}
                  {emergencyRequest.pet.medicalNotes && (
                    <div className="pt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.medical_notes', 'Medical Notes')}</p>
                      <p className="text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950 p-2 rounded mt-1">
                        ⚠️ {emergencyRequest.pet.medicalNotes}
                      </p>
                    </div>
                  )}
                  
                  {/* Allergies */}
                  {emergencyRequest.pet.allergies && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.allergies', 'Allergies')}</p>
                      <p className="text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 p-2 rounded mt-1">
                        🚫 {emergencyRequest.pet.allergies}
                      </p>
                    </div>
                  )}
                  
                  {/* Current Medications */}
                  {emergencyRequest.pet.medications && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.medications', 'Current Medications')}</p>
                      <p className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 p-2 rounded mt-1">
                        💊 {emergencyRequest.pet.medications}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.species', 'Species')}</p>
                    <p className="font-semibold">{emergencyRequest.petSpecies}</p>
                  </div>
                  {emergencyRequest.petBreed && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.breed', 'Breed')}</p>
                      <p className="font-semibold">{emergencyRequest.petBreed}</p>
                    </div>
                  )}
                  {emergencyRequest.petAge && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.age', 'Age')}</p>
                      <p className="font-semibold">{emergencyRequest.petAge} {t('common.years', 'years')}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medical Records */}
          {emergencyRequest.medicalSharingEnabled && emergencyRequest.medicalRecords && emergencyRequest.medicalRecords.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  {t('emergency_profile.medical_records', 'Medical Records')}
                  <Badge variant="outline" className="ml-2">
                    {emergencyRequest.medicalRecords.length} {t('common.files', 'files')}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {t('emergency_profile.records_shared', 'Pet owner has consented to share these records for emergency care')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emergencyRequest.medicalRecords.map((record) => (
                    <div 
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{record.title}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant="secondary" className="text-xs">
                              {getDocumentTypeLabel(record.documentType)}
                            </Badge>
                            <span>{formatDate(record.createdAt)}</span>
                          </div>
                          {record.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{record.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(record.fileUrl, '_blank')}
                        data-testid={`button-view-record-${record.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {t('common.view', 'View')}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-purple-500" />
                {t('emergency_profile.contact', 'Contact Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{emergencyRequest.contactName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a 
                    href={`tel:${emergencyRequest.contactPhone}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {emergencyRequest.contactPhone}
                  </a>
                </div>
                {emergencyRequest.manualLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{emergencyRequest.manualLocation}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons for Clinics */}
          <div className="flex gap-3">
            <Button 
              size="lg" 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => window.open(`tel:${emergencyRequest.contactPhone}`, '_self')}
              data-testid="button-call-owner"
            >
              <Phone className="h-5 w-5 mr-2" />
              {t('emergency_profile.call_owner', 'Call Pet Owner')}
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://wa.me/${emergencyRequest.contactPhone.replace(/[^0-9]/g, '')}`, '_blank')}
              data-testid="button-whatsapp-owner"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>{t('emergency_profile.powered_by', 'Powered by PetSOS - Emergency Pet Care Coordination')}</p>
            <Link href="/" className="text-red-600 hover:underline">
              {t('common.visit_website', 'Visit PetSOS.site')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
