import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2, Building2, Clock, CheckCircle2, AlertCircle, MapPin, Loader2, Search, Filter, X, Activity } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { insertHospitalSchema, type Hospital, type Region } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const hospitalFormSchema = insertHospitalSchema.extend({
  nameEn: z.string().min(1, "Hospital name (English) is required"),
  nameZh: z.string().min(1, "Hospital name (Chinese) is required"),
  addressEn: z.string().min(1, "Address (English) is required"),
  addressZh: z.string().min(1, "Address (Chinese) is required"),
  regionId: z.string().min(1, "Region is required"),
  slug: z.string().min(1, "URL slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
});

type HospitalFormData = z.infer<typeof hospitalFormSchema>;

export default function AdminHospitalsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { toast } = useToast();

  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: hospitals, isLoading: hospitalsLoading } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const stats = {
    total: hospitals?.length ?? 0,
    verified: (hospitals?.filter(h => h.lastVerifiedAt) ?? []).length,
    open247: (hospitals?.filter(h => h.open247) ?? []).length,
    missingGPS: (hospitals?.filter(h => !h.latitude || !h.longitude) ?? []).length,
  };

  const filteredHospitals = hospitals?.filter(hospital => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const nameMatch = hospital.nameEn.toLowerCase().includes(search) || hospital.nameZh.toLowerCase().includes(search);
      const addressMatch = hospital.addressEn.toLowerCase().includes(search) || hospital.addressZh.toLowerCase().includes(search);
      if (!nameMatch && !addressMatch) return false;
    }

    if (filterRegion !== "all" && hospital.regionId !== filterRegion) return false;

    return true;
  }) ?? [];

  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);
  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchTerm("");
    setFilterRegion("all");
    setCurrentPage(1);
  };

  const addForm = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalFormSchema),
    defaultValues: {
      nameEn: "",
      nameZh: "",
      addressEn: "",
      addressZh: "",
      slug: "",
      regionId: "",
      phone: null,
      whatsapp: null,
      websiteUrl: null,
      open247: true,
      latitude: null,
      longitude: null,
      liveStatus: null,
      onSiteVet247: null,
      triagePolicy: null,
      typicalWaitBand: null,
      isolationWard: null,
      ambulanceSupport: null,
      icuLevel: null,
      nurse24h: null,
      ownerVisitPolicy: null,
      eolSupport: null,
      imagingXray: null,
      imagingUS: null,
      imagingCT: null,
      sameDayCT: null,
      inHouseLab: null,
      extLabCutoff: null,
      bloodBankAccess: null,
      sxEmergencySoft: null,
      sxEmergencyOrtho: null,
      anaesMonitoring: null,
      specialistAvail: null,
      whatsappTriage: null,
      parking: null,
      wheelchairAccess: null,
      admissionDeposit: null,
      depositBand: null,
      recheckWindow: null,
      refundPolicy: null,
    },
  });

  const editForm = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalFormSchema),
    defaultValues: {
      nameEn: "",
      nameZh: "",
      addressEn: "",
      addressZh: "",
      slug: "",
      regionId: "",
      phone: null,
      whatsapp: null,
      websiteUrl: null,
      open247: true,
      latitude: null,
      longitude: null,
    },
  });

  const openAddDialog = () => {
    addForm.reset();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    editForm.reset({
      nameEn: hospital.nameEn,
      nameZh: hospital.nameZh,
      addressEn: hospital.addressEn,
      addressZh: hospital.addressZh,
      slug: hospital.slug,
      regionId: hospital.regionId,
      phone: hospital.phone || null,
      whatsapp: hospital.whatsapp || null,
      websiteUrl: hospital.websiteUrl || null,
      open247: hospital.open247,
      latitude: hospital.latitude ? String(hospital.latitude) : null,
      longitude: hospital.longitude ? String(hospital.longitude) : null,
      liveStatus: hospital.liveStatus || null,
      onSiteVet247: hospital.onSiteVet247 || null,
      triagePolicy: hospital.triagePolicy || null,
      typicalWaitBand: hospital.typicalWaitBand || null,
      isolationWard: hospital.isolationWard || null,
      ambulanceSupport: hospital.ambulanceSupport || null,
      icuLevel: hospital.icuLevel || null,
      nurse24h: hospital.nurse24h || null,
      ownerVisitPolicy: hospital.ownerVisitPolicy || null,
      eolSupport: hospital.eolSupport || null,
      imagingXray: hospital.imagingXray || null,
      imagingUS: hospital.imagingUS || null,
      imagingCT: hospital.imagingCT || null,
      sameDayCT: hospital.sameDayCT || null,
      inHouseLab: hospital.inHouseLab || null,
      extLabCutoff: hospital.extLabCutoff || null,
      bloodBankAccess: hospital.bloodBankAccess || null,
      sxEmergencySoft: hospital.sxEmergencySoft || null,
      sxEmergencyOrtho: hospital.sxEmergencyOrtho || null,
      anaesMonitoring: hospital.anaesMonitoring || null,
      specialistAvail: hospital.specialistAvail || null,
      whatsappTriage: hospital.whatsappTriage || null,
      parking: hospital.parking || null,
      wheelchairAccess: hospital.wheelchairAccess || null,
      admissionDeposit: hospital.admissionDeposit || null,
      depositBand: hospital.depositBand || null,
      recheckWindow: hospital.recheckWindow || null,
      refundPolicy: hospital.refundPolicy || null,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setIsDeleteDialogOpen(true);
  };

  const handleAddHospital = async (data: HospitalFormData) => {
    try {
      await apiRequest("POST", "/api/hospitals", data);
      await queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Success",
        description: "Hospital added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add hospital",
        variant: "destructive",
      });
    }
  };

  const handleEditHospital = async (data: HospitalFormData) => {
    if (!selectedHospital) return;

    try {
      await apiRequest("PATCH", `/api/hospitals/${selectedHospital.id}`, data);
      await queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      setIsEditDialogOpen(false);
      setSelectedHospital(null);
      toast({
        title: "Success",
        description: "Hospital updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update hospital",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHospital = async () => {
    if (!selectedHospital) return;

    try {
      await apiRequest("DELETE", `/api/hospitals/${selectedHospital.id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      setIsDeleteDialogOpen(false);
      setSelectedHospital(null);
      toast({
        title: "Success",
        description: "Hospital deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete hospital",
        variant: "destructive",
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  if (hospitalsLoading || regionsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold" data-testid="heading-admin-hospitals">
              Admin: Hospital Management
            </h1>
          </div>
          <p className="text-muted-foreground">Manage 24-hour animal hospital profiles</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Button onClick={openAddDialog} data-testid="button-add-hospital">
            <Plus className="h-4 w-4 mr-2" />
            Add Hospital
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open 24/7</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open247}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing GPS</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.missingGPS}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions?.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || filterRegion !== "all") && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredHospitals.length} of {stats.total} hospitals
          </div>
        </CardContent>
      </Card>

      {/* Hospitals List */}
      <Card>
        <CardHeader>
          <CardTitle>Hospitals</CardTitle>
          <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedHospitals.map((hospital) => {
              const region = regions?.find(r => r.id === hospital.regionId);
              return (
                <div
                  key={hospital.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  data-testid={`hospital-card-${hospital.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{hospital.nameEn}</h3>
                        <Badge variant="outline">{region?.code || "N/A"}</Badge>
                        {hospital.open247 && (
                          <Badge variant="default" className="bg-green-600">
                            24hrs
                          </Badge>
                        )}
                        {hospital.lastVerifiedAt && (
                          <Badge variant="secondary">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{hospital.nameZh}</p>
                      <p className="text-sm mb-1">{hospital.addressEn}</p>
                      <p className="text-sm text-muted-foreground mb-2">{hospital.addressZh}</p>
                      <div className="flex items-center gap-4 text-sm">
                        {hospital.phone && (
                          <span className="text-muted-foreground">
                            📞 {hospital.phone}
                          </span>
                        )}
                        {hospital.latitude && hospital.longitude && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {Number(hospital.latitude).toFixed(4)}, {Number(hospital.longitude).toFixed(4)}
                          </span>
                        )}
                        {(!hospital.latitude || !hospital.longitude) && (
                          <Badge variant="destructive">Missing GPS</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(hospital)}
                        data-testid={`button-edit-${hospital.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(hospital)}
                        data-testid={`button-delete-${hospital.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {paginatedHospitals.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No hospitals found
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Hospital Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Hospital</DialogTitle>
            <DialogDescription>Enter the hospital details below</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddHospital)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital Name (English) *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Central Animal Hospital"
                          onChange={(e) => {
                            field.onChange(e);
                            if (!addForm.getValues("slug")) {
                              addForm.setValue("slug", generateSlug(e.target.value));
                            }
                          }}
                          data-testid="input-name-en"
                        />
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
                      <FormLabel>Hospital Name (Chinese) *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="中環動物醫院" data-testid="input-name-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="central-animal-hospital" data-testid="input-slug" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="addressEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (English) *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="123 Queen's Road Central" data-testid="input-address-en" />
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
                      <FormLabel>Address (Chinese) *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="皇后大道中123號" data-testid="input-address-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={addForm.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormField
                  control={addForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="+852 1234 5678" data-testid="input-phone" />
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
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="+852 1234 5678" data-testid="input-whatsapp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="22.2820" data-testid="input-latitude" />
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
                        <Input {...field} value={field.value || ""} placeholder="114.1585" data-testid="input-longitude" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="open247"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Open 24/7</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-open247"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit">Add Hospital</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Hospital Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Hospital</DialogTitle>
            <DialogDescription>Update the hospital details</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditHospital)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital Name (English) *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Central Animal Hospital" data-testid="input-edit-name-en" />
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
                      <FormLabel>Hospital Name (Chinese) *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="中環動物醫院" data-testid="input-edit-name-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="central-animal-hospital" data-testid="input-edit-slug" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="addressEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (English) *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="123 Queen's Road Central" data-testid="input-edit-address-en" />
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
                      <FormLabel>Address (Chinese) *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="皇后大道中123號" data-testid="input-edit-address-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region *</FormLabel>
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
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="+852 1234 5678" data-testid="input-edit-phone" />
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
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="+852 1234 5678" data-testid="input-edit-whatsapp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="22.2820" data-testid="input-edit-latitude" />
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
                        <Input {...field} value={field.value || ""} placeholder="114.1585" data-testid="input-edit-longitude" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="open247"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Open 24/7</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-open247"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedHospital?.nameEn}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHospital}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
