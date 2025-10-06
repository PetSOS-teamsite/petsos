import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Building2, Phone, Mail, MapPin, Globe, Clock, AlertCircle, Pencil, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClinicSchema, type Clinic, type Region } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

const clinicFormSchema = insertClinicSchema.extend({
  name: z.string().min(1, "Clinic name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  regionId: z.string().min(1, "Region is required"),
});

type ClinicFormData = z.infer<typeof clinicFormSchema>;

interface EmergencyRequest {
  id: string;
  userId: string;
  petId: string;
  symptom: string;
  severity: string;
  userLocation: string | null;
  status: string;
  createdAt: string;
  pet?: {
    name: string;
    species: string;
    breed: string | null;
  };
  user?: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    email: string | null;
  };
}

export default function ClinicDashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: clinic, isLoading: clinicLoading } = useQuery<Clinic>({
    queryKey: [`/api/clinics/${user?.clinicId}`],
    enabled: !!user?.clinicId,
  });

  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: emergencyRequests, isLoading: requestsLoading } = useQuery<EmergencyRequest[]>({
    queryKey: [`/api/clinics/${user?.clinicId}/emergency-requests`],
    enabled: !!user?.clinicId,
  });

  const availabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      if (!clinic?.id) return;
      return apiRequest("PATCH", `/api/clinics/${clinic.id}`, { isAvailable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clinics/${user?.clinicId}`] });
      toast({
        title: t("success"),
        description: t("clinic.availability_updated"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("error_occurred"),
        variant: "destructive",
      });
    },
  });

  const editForm = useForm<ClinicFormData>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: clinic ? {
      name: clinic.name,
      nameZh: clinic.nameZh,
      address: clinic.address,
      addressZh: clinic.addressZh,
      phone: clinic.phone,
      whatsapp: clinic.whatsapp,
      email: clinic.email,
      regionId: clinic.regionId,
      is24Hour: clinic.is24Hour,
      isAvailable: clinic.isAvailable,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      status: clinic.status,
      services: clinic.services,
    } : undefined,
  });

  const handleEditClinic = async (data: ClinicFormData) => {
    try {
      if (!clinic?.id) return;
      
      await apiRequest("PATCH", `/api/clinics/${clinic.id}`, data);
      await queryClient.invalidateQueries({ queryKey: [`/api/clinics/${user?.clinicId}`] });
      
      setIsEditDialogOpen(false);
      toast({
        title: t("success"),
        description: t("clinic.updated_successfully"),
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("error_occurred"),
        variant: "destructive",
      });
    }
  };

  const handleAvailabilityToggle = (checked: boolean) => {
    availabilityMutation.mutate(checked);
  };

  const openEditDialog = () => {
    if (clinic) {
      editForm.reset({
        name: clinic.name,
        nameZh: clinic.nameZh,
        address: clinic.address,
        addressZh: clinic.addressZh,
        phone: clinic.phone,
        whatsapp: clinic.whatsapp,
        email: clinic.email,
        regionId: clinic.regionId,
        is24Hour: clinic.is24Hour,
        isAvailable: clinic.isAvailable,
        latitude: clinic.latitude,
        longitude: clinic.longitude,
        status: clinic.status,
        services: clinic.services,
      });
      setIsEditDialogOpen(true);
    }
  };

  if (!user?.clinicId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-[#EF4444] text-white shadow-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/">
              <h1 className="text-2xl font-bold cursor-pointer" data-testid="text-logo">PetSOS</h1>
            </Link>
          </div>
        </header>

        <div className="container mx-auto py-12 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                {t("clinic.not_linked")}
              </CardTitle>
              <CardDescription>
                {t("clinic.contact_admin")}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (clinicLoading || regionsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-[#EF4444] text-white shadow-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/">
              <h1 className="text-2xl font-bold cursor-pointer" data-testid="text-logo">PetSOS</h1>
            </Link>
          </div>
        </header>

        <div className="container mx-auto py-8 px-4 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-[#EF4444] text-white shadow-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/">
              <h1 className="text-2xl font-bold cursor-pointer" data-testid="text-logo">PetSOS</h1>
            </Link>
          </div>
        </header>

        <div className="container mx-auto py-12 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                {t("clinic.not_found")}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const regionName = regions?.find(r => r.id === clinic.regionId)?.nameEn || "Unknown";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-[#EF4444] text-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer" data-testid="text-logo">PetSOS</h1>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" className="text-white hover:bg-red-600" data-testid="link-profile">
              {t("nav.profile")}
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-dashboard-title">
              <Building2 className="h-8 w-8" />
              {t("clinic.dashboard")}
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-clinic-name">
              {clinic.name}
            </p>
          </div>
          <Button onClick={openEditDialog} data-testid="button-edit-clinic">
            <Pencil className="h-4 w-4 mr-2" />
            {t("clinic.edit_details")}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Clinic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("clinic.information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{t("clinic.address")}</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-clinic-address">{clinic.address}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("clinic.phone")}</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-clinic-phone">{clinic.phone}</p>
                </div>
              </div>

              {clinic.whatsapp && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t("clinic.whatsapp")}</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-clinic-whatsapp">{clinic.whatsapp}</p>
                    </div>
                  </div>
                </>
              )}

              {clinic.email && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t("clinic.email")}</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-clinic-email">{clinic.email}</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("clinic.region")}</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-clinic-region">{regionName}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("clinic.hours")}</p>
                  <Badge variant={clinic.is24Hour ? "default" : "secondary"} data-testid="badge-24hour">
                    {clinic.is24Hour ? t("clinic.24_hour") : t("clinic.regular_hours")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("clinic.availability_status")}</CardTitle>
              <CardDescription>{t("clinic.availability_description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{t("clinic.currently_available")}</p>
                  <p className="text-sm text-muted-foreground">
                    {clinic.isAvailable ? t("clinic.accepting_emergencies") : t("clinic.not_accepting")}
                  </p>
                </div>
                <Switch
                  checked={clinic.isAvailable}
                  onCheckedChange={handleAvailabilityToggle}
                  disabled={availabilityMutation.isPending}
                  data-testid="switch-availability"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>{t("clinic.note")}:</strong> {t("clinic.availability_note")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Requests Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("clinic.emergency_requests")}</CardTitle>
            <CardDescription>{t("clinic.recent_broadcasts")}</CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : emergencyRequests && emergencyRequests.length > 0 ? (
              <div className="space-y-4">
                {emergencyRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-2" data-testid={`request-${request.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={request.severity === "critical" ? "destructive" : "default"}>
                          {request.severity}
                        </Badge>
                        <Badge variant="outline">{request.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-medium">
                        {t("clinic.pet")}: {request.pet?.name || "Unknown"} ({request.pet?.species})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("clinic.symptom")}: {request.symptom}
                      </p>
                    </div>

                    {request.user && (
                      <div className="text-sm">
                        <p>
                          {t("clinic.owner")}: {request.user.firstName} {request.user.lastName}
                        </p>
                        {request.user.phone && (
                          <p className="text-muted-foreground">
                            {t("clinic.contact")}: {request.user.phone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p data-testid="text-no-requests">{t("clinic.no_requests")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Clinic Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("clinic.edit_details")}</DialogTitle>
            <DialogDescription>
              {t("clinic.edit_description")}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditClinic)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("clinic.name_en")}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-clinic-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="nameZh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("clinic.name_zh")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-clinic-name-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("clinic.address_en")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-clinic-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="addressZh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("clinic.address_zh")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-clinic-address-zh" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("clinic.phone")}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-clinic-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("clinic.whatsapp")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-clinic-whatsapp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("clinic.email")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value || ""} data-testid="input-clinic-email-edit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="regionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("clinic.region")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-clinic-region">
                          <SelectValue placeholder={t("clinic.select_region")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions?.map(region => (
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
                control={editForm.control}
                name="is24Hour"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("clinic.24_hour_service")}</FormLabel>
                      <FormDescription>
                        {t("clinic.24_hour_description")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-24hour"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={editForm.formState.isSubmitting} data-testid="button-save-clinic">
                  {editForm.formState.isSubmitting ? t("saving") : t("save_changes")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
