import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2, Building2, Clock, CheckCircle2, AlertCircle, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClinicSchema, type Clinic, type Region, type EmergencyRequest } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const clinicFormSchema = insertClinicSchema.extend({
  name: z.string().min(1, "Clinic name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  regionId: z.string().min(1, "Region is required"),
});

type ClinicFormData = z.infer<typeof clinicFormSchema>;

export default function AdminClinicsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isGeocodingAdd, setIsGeocodingAdd] = useState(false);
  const [isGeocodingEdit, setIsGeocodingEdit] = useState(false);
  const { toast } = useToast();

  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: clinics, isLoading: clinicsLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const { data: emergencyRequests } = useQuery<EmergencyRequest[]>({
    queryKey: ["/api/emergency-requests"],
  });

  const stats = {
    total: clinics?.length ?? 0,
    available: (clinics?.filter(c => c.isAvailable) ?? []).length,
    twentyFourHour: (clinics?.filter(c => c.is24Hour) ?? []).length,
    emergencyRequests: emergencyRequests?.length ?? 0,
  };

  const addForm = useForm<ClinicFormData>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: "",
      nameZh: null,
      address: "",
      addressZh: null,
      phone: "",
      whatsapp: null,
      email: null,
      regionId: "",
      is24Hour: false,
      isAvailable: true,
      isSupportHospital: false,
      latitude: null,
      longitude: null,
      status: "active",
      services: [],
    },
  });

  const editForm = useForm<ClinicFormData>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: "",
      nameZh: null,
      address: "",
      addressZh: null,
      phone: "",
      whatsapp: null,
      email: null,
      regionId: "",
      is24Hour: false,
      isAvailable: true,
      isSupportHospital: false,
      latitude: null,
      longitude: null,
      status: "active",
      services: [],
    },
  });

  const handleAddClinic = async (data: ClinicFormData) => {
    try {
      await apiRequest("POST", "/api/clinics", data);

      await queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Success",
        description: "Clinic added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add clinic",
        variant: "destructive",
      });
    }
  };

  const handleEditClinic = async (data: ClinicFormData) => {
    if (!selectedClinic) return;

    try {
      await apiRequest("PATCH", `/api/clinics/${selectedClinic.id}`, data);

      await queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      setIsEditDialogOpen(false);
      setSelectedClinic(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Clinic updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update clinic",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClinic = async () => {
    if (!selectedClinic) return;

    try {
      await apiRequest("DELETE", `/api/clinics/${selectedClinic.id}`);

      await queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      setIsDeleteDialogOpen(false);
      setSelectedClinic(null);
      toast({
        title: "Success",
        description: "Clinic deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete clinic",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (clinic: Clinic) => {
    setSelectedClinic(clinic);
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
      isSupportHospital: clinic.isSupportHospital,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      status: clinic.status,
      services: clinic.services,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleAvailability = async (clinic: Clinic) => {
    try {
      await apiRequest("PATCH", `/api/clinics/${clinic.id}`, {
        isAvailable: !clinic.isAvailable,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Success",
        description: `Clinic ${clinic.isAvailable ? 'marked unavailable' : 'marked available'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update clinic availability",
        variant: "destructive",
      });
    }
  };

  const getRegionName = (regionId: string) => {
    const region = regions?.find((r) => r.id === regionId);
    return region ? region.code : regionId;
  };

  const handleAutoFillGPSAdd = async () => {
    const address = addForm.getValues("address");
    if (!address) {
      toast({
        title: "Error",
        description: "Please enter an address first",
        variant: "destructive",
      });
      return;
    }

    setIsGeocodingAdd(true);
    try {
      const res = await apiRequest("POST", "/api/geocode", { address });
      const data = await res.json();
      
      if (data.latitude && data.longitude) {
        addForm.setValue("latitude", data.latitude);
        addForm.setValue("longitude", data.longitude);
        toast({
          title: "Success",
          description: "GPS coordinates filled automatically",
        });
      } else {
        throw new Error("Invalid response from geocoding service");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to geocode address";
      toast({
        title: "Geocoding Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeocodingAdd(false);
    }
  };

  const handleAutoFillGPSEdit = async () => {
    const address = editForm.getValues("address");
    if (!address) {
      toast({
        title: "Error",
        description: "Please enter an address first",
        variant: "destructive",
      });
      return;
    }

    setIsGeocodingEdit(true);
    try {
      const res = await apiRequest("POST", "/api/geocode", { address });
      const data = await res.json();
      
      if (data.latitude && data.longitude) {
        editForm.setValue("latitude", data.latitude);
        editForm.setValue("longitude", data.longitude);
        toast({
          title: "Success",
          description: "GPS coordinates filled automatically",
        });
      } else {
        throw new Error("Invalid response from geocoding service");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to geocode address";
      toast({
        title: "Geocoding Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeocodingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin: Clinic Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage veterinary clinics
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              data-testid="button-add-clinic"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Clinic
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Clinics
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-total-clinics">
                      {clinicsLoading ? "..." : stats.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Available Now
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-available-clinics">
                      {clinicsLoading ? "..." : stats.available}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      24-Hour Clinics
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-24hour-clinics">
                      {clinicsLoading ? "..." : stats.twentyFourHour}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Requests
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-emergency-requests">
                      {stats.emergencyRequests}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Clinic List */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            All Clinics
          </h2>
          <div className="space-y-3">
            {clinicsLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : clinics && clinics.length > 0 ? (
              clinics.map((clinic) => (
                <Card key={clinic.id} data-testid={`card-clinic-${clinic.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white" data-testid={`text-clinic-name-${clinic.id}`}>
                            {clinic.name}
                          </h3>
                          <Badge variant="outline">{getRegionName(clinic.regionId)}</Badge>
                          {clinic.is24Hour && (
                            <Badge className="bg-green-600">24h</Badge>
                          )}
                          {clinic.isSupportHospital && (
                            <Badge className="bg-blue-600" data-testid={`badge-support-${clinic.id}`}>
                              ⭐ Support
                            </Badge>
                          )}
                          <Badge 
                            className={clinic.isAvailable ? "bg-green-500" : "bg-gray-400"}
                            data-testid={`badge-availability-${clinic.id}`}
                          >
                            {clinic.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        {clinic.nameZh && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {clinic.nameZh}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {clinic.address}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {clinic.phone}
                          {clinic.whatsapp && ` • WhatsApp: ${clinic.whatsapp}`}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Real-time Availability:
                          </span>
                          <Switch
                            checked={clinic.isAvailable}
                            onCheckedChange={() => handleToggleAvailability(clinic)}
                            data-testid={`switch-availability-${clinic.id}`}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(clinic)}
                          data-testid={`button-edit-${clinic.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(clinic)}
                          data-testid={`button-delete-${clinic.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No clinics found
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Add Clinic Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Clinic</DialogTitle>
            <DialogDescription>
              Enter the details for the new veterinary clinic
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddClinic)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Name (English)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="nameZh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Name (Chinese)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-name-zh" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (English)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="addressZh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Chinese)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-address-zh" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+852 1234 5678" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="+852 1234 5678" data-testid="input-whatsapp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="email" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="regionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions?.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.nameEn} ({region.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1 text-sm">GPS Coordinates (Required for proximity filtering)</p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                      Automatically fill coordinates from address using Google Maps
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoFillGPSAdd}
                      disabled={isGeocodingAdd}
                      data-testid="button-autofill-gps"
                      className="bg-white dark:bg-gray-800"
                    >
                      {isGeocodingAdd ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting coordinates...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          Auto-fill GPS
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., 22.2820" data-testid="input-latitude" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., 114.1585" data-testid="input-longitude" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={addForm.control}
                name="is24Hour"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">24-Hour Service</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This clinic operates 24 hours a day
                      </p>
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
              <FormField
                control={addForm.control}
                name="isSupportHospital"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold text-blue-900 dark:text-blue-100">⭐ PetSOS Support Hospital</FormLabel>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Official partner hospital for priority emergency broadcasts
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-support-hospital"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  data-testid="button-cancel-add"
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit-add">
                  Add Clinic
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Clinic Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Clinic</DialogTitle>
            <DialogDescription>
              Update the clinic details
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditClinic)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Name (English)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-name" />
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
                    <FormLabel>Clinic Name (Chinese)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-edit-name-zh" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (English)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-address" />
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
                    <FormLabel>Address (Chinese)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-edit-address-zh" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-phone" />
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
                      <FormLabel>WhatsApp (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-edit-whatsapp" />
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
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="email" data-testid="input-edit-email" />
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
                    <FormLabel>Region</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions?.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.nameEn} ({region.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1 text-sm">GPS Coordinates (Required for proximity filtering)</p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                      Automatically fill coordinates from address using Google Maps
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoFillGPSEdit}
                      disabled={isGeocodingEdit}
                      data-testid="button-edit-autofill-gps"
                      className="bg-white dark:bg-gray-800"
                    >
                      {isGeocodingEdit ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting coordinates...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          Auto-fill GPS
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., 22.2820" data-testid="input-edit-latitude" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., 114.1585" data-testid="input-edit-longitude" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={editForm.control}
                name="is24Hour"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">24-Hour Service</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This clinic operates 24 hours a day
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-24hour"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isSupportHospital"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold text-blue-900 dark:text-blue-100">⭐ PetSOS Support Hospital</FormLabel>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Official partner hospital for priority emergency broadcasts
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-support-hospital"
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
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit-edit">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clinic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedClinic?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClinic}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
