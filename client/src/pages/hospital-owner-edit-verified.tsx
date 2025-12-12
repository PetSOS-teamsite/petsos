import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Loader2, Check, Clock, Lock, Building2, Stethoscope, Users, DollarSign, Phone, Image as ImageIcon, Upload, XCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useStorageStatus } from "@/hooks/useStorageStatus";
import { formatDate } from "@/lib/dateFormat";
import type { Hospital, Region } from "@shared/schema";

const verificationSchema = z.object({
  verificationCode: z.string().length(6, "Verification code must be 6 digits").regex(/^\d+$/, "Must be 6 digits"),
});

type VerificationData = z.infer<typeof verificationSchema>;

const hospitalFormSchema = z.object({
  nameEn: z.string().min(1, "Hospital name (English) is required"),
  nameZh: z.string().min(1, "Hospital name (Chinese) is required"),
  addressEn: z.string().min(1, "Address (English) is required"),
  addressZh: z.string().min(1, "Address (Chinese) is required"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  websiteUrl: z.string().optional(),
  regionId: z.string().min(1, "Region is required"),
  open247: z.boolean().default(true),
  // Facilities
  parking: z.boolean().optional(),
  wheelchairAccess: z.boolean().optional(),
  isolationWard: z.boolean().optional(),
  ambulanceSupport: z.boolean().optional(),
  eolSupport: z.boolean().optional(),
  whatsappTriage: z.boolean().optional(),
  // Medical Services
  icuLevel: z.string().optional(),
  imagingXray: z.boolean().optional(),
  imagingUS: z.boolean().optional(),
  imagingCT: z.boolean().optional(),
  sameDayCT: z.boolean().optional(),
  inHouseLab: z.boolean().optional(),
  extLabCutoff: z.string().optional(),
  bloodBankAccess: z.string().optional(),
  sxEmergencySoft: z.boolean().optional(),
  sxEmergencyOrtho: z.boolean().optional(),
  anaesMonitoring: z.string().optional(),
  specialistAvail: z.string().optional(),
  // Additional Medical Equipment
  oxygenTherapy: z.boolean().optional(),
  ventilator: z.boolean().optional(),
  bloodTransfusion: z.boolean().optional(),
  imagingMRI: z.boolean().optional(),
  endoscopy: z.boolean().optional(),
  dialysis: z.boolean().optional(),
  defibrillator: z.boolean().optional(),
  // Staffing
  onSiteVet247: z.boolean().optional(),
  nurse24h: z.boolean().optional(),
  // Operations
  triagePolicy: z.string().optional(),
  typicalWaitBand: z.string().optional(),
  ownerVisitPolicy: z.string().optional(),
  recheckWindow: z.string().optional(),
  // Financial
  admissionDeposit: z.boolean().optional(),
  depositBand: z.string().optional(),
  refundPolicy: z.string().optional(),
  // Photos
  photos: z.any().optional(),
});

type HospitalFormData = z.infer<typeof hospitalFormSchema>;

export default function HospitalOwnerEditVerifiedPage() {
  const { toast } = useToast();
  const { isStorageAvailable } = useStorageStatus();
  const [match, params] = useRoute("/hospital/edit/:slug");
  const [verified, setVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hospitalSlug = params?.slug as string;

  const { data: hospital, isLoading: hospitalLoading } = useQuery<Hospital | null>({
    queryKey: ["/api/hospitals", hospitalSlug],
    queryFn: async () => {
      if (!hospitalSlug) return null;
      const response = await fetch(`/api/hospitals/slug/${hospitalSlug}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!hospitalSlug,
  });

  const { data: regions } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const verifyForm = useForm<VerificationData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { verificationCode: "" },
  });

  const hospitalForm = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalFormSchema),
    defaultValues: {
      nameEn: "",
      nameZh: "",
      addressEn: "",
      addressZh: "",
      phone: "",
      whatsapp: "",
      email: "",
      websiteUrl: "",
      regionId: "",
      open247: true,
      parking: false,
      wheelchairAccess: false,
      isolationWard: false,
      ambulanceSupport: false,
      eolSupport: false,
      whatsappTriage: false,
      icuLevel: "",
      imagingXray: false,
      imagingUS: false,
      imagingCT: false,
      sameDayCT: false,
      inHouseLab: false,
      extLabCutoff: "",
      bloodBankAccess: "",
      sxEmergencySoft: false,
      sxEmergencyOrtho: false,
      anaesMonitoring: "",
      specialistAvail: "",
      oxygenTherapy: false,
      ventilator: false,
      bloodTransfusion: false,
      imagingMRI: false,
      endoscopy: false,
      dialysis: false,
      defibrillator: false,
      onSiteVet247: false,
      nurse24h: false,
      triagePolicy: "",
      typicalWaitBand: "",
      ownerVisitPolicy: "",
      recheckWindow: "",
      admissionDeposit: false,
      depositBand: "",
      refundPolicy: "",
      photos: [],
    },
  });

  // Photo management functions
  const photos = hospitalForm.watch("photos") as string[] | null;
  
  const addPhoto = () => {
    if (newPhotoUrl.trim()) {
      const currentPhotos = (photos || []) as string[];
      hospitalForm.setValue("photos", [...currentPhotos, newPhotoUrl.trim()] as any, {
        shouldDirty: true,
        shouldTouch: true
      });
      setNewPhotoUrl("");
    }
  };

  const removePhoto = (index: number) => {
    const currentPhotos = (photos || []) as string[];
    hospitalForm.setValue("photos", currentPhotos.filter((_, i) => i !== index) as any, {
      shouldDirty: true,
      shouldTouch: true
    });
  };

  useEffect(() => {
    if (hospital) {
      hospitalForm.reset({
        nameEn: hospital.nameEn || "",
        nameZh: hospital.nameZh || "",
        addressEn: hospital.addressEn || "",
        addressZh: hospital.addressZh || "",
        phone: hospital.phone || "",
        whatsapp: hospital.whatsapp || "",
        email: hospital.email || "",
        websiteUrl: hospital.websiteUrl || "",
        regionId: hospital.regionId || "",
        open247: hospital.open247 ?? true,
        parking: hospital.parking ?? false,
        wheelchairAccess: hospital.wheelchairAccess ?? false,
        isolationWard: hospital.isolationWard ?? false,
        ambulanceSupport: hospital.ambulanceSupport ?? false,
        eolSupport: hospital.eolSupport ?? false,
        whatsappTriage: hospital.whatsappTriage ?? false,
        icuLevel: hospital.icuLevel || "",
        imagingXray: hospital.imagingXray ?? false,
        imagingUS: hospital.imagingUS ?? false,
        imagingCT: hospital.imagingCT ?? false,
        sameDayCT: hospital.sameDayCT ?? false,
        inHouseLab: hospital.inHouseLab ?? false,
        extLabCutoff: hospital.extLabCutoff || "",
        bloodBankAccess: hospital.bloodBankAccess || "",
        sxEmergencySoft: hospital.sxEmergencySoft ?? false,
        sxEmergencyOrtho: hospital.sxEmergencyOrtho ?? false,
        anaesMonitoring: hospital.anaesMonitoring || "",
        specialistAvail: hospital.specialistAvail || "",
        oxygenTherapy: hospital.oxygenTherapy ?? false,
        ventilator: hospital.ventilator ?? false,
        bloodTransfusion: hospital.bloodTransfusion ?? false,
        imagingMRI: hospital.imagingMRI ?? false,
        endoscopy: hospital.endoscopy ?? false,
        dialysis: hospital.dialysis ?? false,
        defibrillator: hospital.defibrillator ?? false,
        onSiteVet247: hospital.onSiteVet247 ?? false,
        nurse24h: hospital.nurse24h ?? false,
        triagePolicy: hospital.triagePolicy || "",
        typicalWaitBand: hospital.typicalWaitBand || "",
        ownerVisitPolicy: hospital.ownerVisitPolicy || "",
        recheckWindow: hospital.recheckWindow || "",
        admissionDeposit: hospital.admissionDeposit ?? false,
        depositBand: hospital.depositBand || "",
        refundPolicy: hospital.refundPolicy || "",
        photos: hospital.photos || [],
      });
    }
  }, [hospital]);

  const verifyMutation = useMutation({
    mutationFn: async (data: VerificationData) => {
      if (!hospital?.id) throw new Error("Hospital not found");
      const response = await fetch(`/api/hospitals/${hospital.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationCode: data.verificationCode }),
      });
      if (!response.ok) throw new Error("Invalid verification code");
      return response.json();
    },
    onSuccess: () => {
      setVerified(true);
      toast({ title: "Verified successfully!" });
    },
    onError: () => {
      toast({ title: "Invalid verification code", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: HospitalFormData) => {
      if (!hospital?.id) throw new Error("Hospital not found");
      const code = verifyForm.getValues("verificationCode");
      return apiRequest("PATCH", `/api/hospitals/${hospital.id}/update-owner`, { 
        ...data, 
        verificationCode: code 
      });
    },
    onSuccess: () => {
      setSaved(true);
      toast({ title: "Hospital information saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals", hospitalSlug] });
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error: any) => {
      toast({ title: "Error saving hospital", description: error.message, variant: "destructive" });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!hospital?.id) throw new Error("Hospital not found");
      const code = verifyForm.getValues("verificationCode");
      
      const urlResponse = await apiRequest('POST', `/api/hospitals/${hospital.id}/photo-upload-url`, { 
        verificationCode: code 
      });
      const { uploadURL } = await urlResponse.json();
      
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload photo');
      }
      
      const filePath = uploadURL.split('?')[0];
      
      const photoResponse = await apiRequest('POST', `/api/hospitals/${hospital.id}/photo`, { 
        verificationCode: code,
        filePath 
      });
      return await photoResponse.json();
    },
    onSuccess: (data) => {
      const newPhotoUrl = data.photoUrl;
      const currentPhotos = (hospitalForm.getValues("photos") || []) as string[];
      hospitalForm.setValue("photos", [...currentPhotos, newPhotoUrl] as any, {
        shouldDirty: true,
        shouldTouch: true
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals", hospitalSlug] });
      toast({ title: "Photo uploaded successfully!" });
      setIsUploadingPhoto(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to upload photo", description: error.message, variant: "destructive" });
      setIsUploadingPhoto(false);
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoUrl: string) => {
      if (!hospital?.id) throw new Error("Hospital not found");
      const code = verifyForm.getValues("verificationCode");
      
      const response = await fetch(`/api/hospitals/${hospital.id}/photo`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationCode: code, photoUrl }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete photo');
      }
      
      return { photoUrl };
    },
    onSuccess: ({ photoUrl }) => {
      const currentPhotos = (hospitalForm.getValues("photos") || []) as string[];
      hospitalForm.setValue("photos", currentPhotos.filter(url => url !== photoUrl) as any, {
        shouldDirty: true,
        shouldTouch: true
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals", hospitalSlug] });
      toast({ title: "Photo removed successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to remove photo", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      event.target.value = '';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      event.target.value = '';
      return;
    }
    
    setIsUploadingPhoto(true);
    uploadPhotoMutation.mutate(file);
    event.target.value = '';
  };

  if (!match) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><p className="text-gray-500">Hospital not found</p></div>;

  if (hospitalLoading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Hospital not found</p>
              <p className="text-sm text-gray-400">Please check the hospital link and try again.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Verify Access
              </CardTitle>
              <CardDescription>Enter the 6-digit verification code to edit hospital information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...verifyForm}>
                <form onSubmit={verifyForm.handleSubmit((data) => verifyMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={verifyForm.control}
                    name="verificationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="000000"
                            maxLength={6}
                            className="text-center text-2xl tracking-widest"
                            data-testid="input-verification-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={verifyMutation.isPending} data-testid="button-verify">
                    {verifyMutation.isPending ? "Verifying..." : "Verify"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Hospital Information</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your hospital details</p>
            </div>
          </div>
          {hospital?.updatedAt && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              Last updated: {formatDate(hospital.updatedAt)}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Form {...hospitalForm}>
          <form onSubmit={hospitalForm.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={hospitalForm.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospital Name (English) *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name-en" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="nameZh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospital Name (Chinese) *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name-zh" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={hospitalForm.control}
                    name="addressEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (English) *</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} data-testid="input-address-en" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="addressZh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Chinese) *</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} data-testid="input-address-zh" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={hospitalForm.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-region">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions?.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={hospitalForm.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="https://www.example.com" data-testid="input-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={hospitalForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-whatsapp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="email" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Facilities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Facilities
                </CardTitle>
                <CardDescription>What facilities does your hospital offer?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={hospitalForm.control}
                    name="parking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Parking Available</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-parking" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="wheelchairAccess"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Wheelchair Accessible</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-wheelchair" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="isolationWard"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Isolation Ward</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-isolation" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="ambulanceSupport"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ambulance Support</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-ambulance" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="eolSupport"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">End-of-Life Support</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-eol" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="whatsappTriage"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">WhatsApp Triage</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-whatsapp-triage" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Medical Services
                </CardTitle>
                <CardDescription>What medical services and equipment do you have?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={hospitalForm.control}
                  name="icuLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ICU Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-icu">
                            <SelectValue placeholder="Select ICU level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="full">Full ICU</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={hospitalForm.control}
                    name="imagingXray"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">X-Ray</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-xray" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="imagingUS"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ultrasound</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-ultrasound" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="imagingCT"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">CT Scan</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-ct" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="sameDayCT"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Same-Day CT</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-sameday-ct" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="inHouseLab"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">In-House Laboratory</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-lab" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="sxEmergencySoft"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Emergency Soft Tissue Surgery</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-soft-surgery" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="sxEmergencyOrtho"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Emergency Orthopedic Surgery</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-ortho-surgery" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="oxygenTherapy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Oxygen Therapy / Tanks</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-oxygen" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="ventilator"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ventilator / Respirator</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-ventilator" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="bloodTransfusion"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Blood Bank (transfusion support)</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-blood-transfusion" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="imagingMRI"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">MRI Imaging</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-mri" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="endoscopy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Endoscopy</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-endoscopy" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="dialysis"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Dialysis / Renal Support</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-dialysis" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="defibrillator"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Defibrillator / AED</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-defibrillator" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={hospitalForm.control}
                  name="extLabCutoff"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Lab Cutoff Time</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="e.g., 6:00 PM" data-testid="input-lab-cutoff" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={hospitalForm.control}
                  name="bloodBankAccess"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Bank Access</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-blood-bank">
                            <SelectValue placeholder="Select blood bank access" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="limited">Limited</SelectItem>
                          <SelectItem value="full">Full Access</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={hospitalForm.control}
                  name="anaesMonitoring"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anesthesia Monitoring</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-anesthesia">
                            <SelectValue placeholder="Select monitoring level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="full">Full Monitoring</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={hospitalForm.control}
                  name="specialistAvail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialist Availability</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-specialist">
                            <SelectValue placeholder="Select specialist availability" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="on_call">On-Call</SelectItem>
                          <SelectItem value="on_site">On-Site</SelectItem>
                          <SelectItem value="24h">24/7 Available</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Staffing & Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staffing & Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={hospitalForm.control}
                    name="open247"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">24-Hour Operation</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || true} onCheckedChange={field.onChange} data-testid="switch-24h" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="onSiteVet247"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">On-Site Vet 24/7</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-vet-247" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={hospitalForm.control}
                    name="nurse24h"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">24-Hour Nursing</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-nurse-24h" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={hospitalForm.control}
                  name="triagePolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Triage Policy</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Describe your triage policy..." rows={2} data-testid="input-triage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={hospitalForm.control}
                  name="typicalWaitBand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typical Wait Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-wait-time">
                            <SelectValue placeholder="Select typical wait time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="<15min">&lt;15 minutes</SelectItem>
                          <SelectItem value="15-30min">15-30 minutes</SelectItem>
                          <SelectItem value="30-60min">30-60 minutes</SelectItem>
                          <SelectItem value=">60min">&gt;60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={hospitalForm.control}
                  name="ownerVisitPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Visiting Policy</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Describe your visiting hours and policies..." rows={2} data-testid="input-visit-policy" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={hospitalForm.control}
                  name="recheckWindow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recheck Window</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="e.g., Free recheck within 7 days" data-testid="input-recheck" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Financial */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={hospitalForm.control}
                  name="admissionDeposit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Requires Admission Deposit</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-deposit" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={hospitalForm.control}
                  name="depositBand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Range</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-deposit-range">
                            <SelectValue placeholder="Select deposit range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="<5k">Less than HKD 5,000</SelectItem>
                          <SelectItem value="5k-10k">HKD 5,000 - 10,000</SelectItem>
                          <SelectItem value="10k-20k">HKD 10,000 - 20,000</SelectItem>
                          <SelectItem value=">20k">More than HKD 20,000</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={hospitalForm.control}
                  name="refundPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refund Policy</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Describe your refund policy..." rows={2} data-testid="input-refund" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Hospital Photos
                </CardTitle>
                <CardDescription>Add photos of your hospital to help pet owners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  {isStorageAvailable && (
                    <>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="flex-shrink-0"
                        data-testid="button-upload-photo"
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4 mr-2" />
                            Upload from Device
                          </>
                        )}
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isUploadingPhoto}
                        data-testid="input-file-upload"
                      />
                    </>
                  )}
                  <div className="flex gap-2 flex-1">
                    <Input
                      placeholder={isStorageAvailable ? "Or enter photo URL" : "Enter photo URL"}
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
                      data-testid="input-photo-url"
                    />
                    <Button type="button" onClick={addPhoto} data-testid="button-add-photo">
                      <Upload className="h-4 w-4 mr-2" />
                      Add URL
                    </Button>
                  </div>
                </div>

                {photos && photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Hospital photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.png';
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deletePhotoMutation.mutate(url)}
                          disabled={deletePhotoMutation.isPending}
                          data-testid={`button-remove-photo-${index}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Photo {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No photos added yet</p>
                    <p className="text-sm">Upload from your device or add photo URLs</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button type="submit" disabled={updateMutation.isPending} className="w-full" size="lg" data-testid="button-save">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
