import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2, Building2, Clock, CheckCircle2, AlertCircle, Loader2, Search, X, Activity, MessageCircle, Phone, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  FormDescription,
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
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Hospital as Clinic, Region } from "@shared/schema";

const clinicFormSchema = z.object({
  nameEn: z.string().min(1, "Clinic name (English) is required"),
  nameZh: z.string().min(1, "Clinic name (Chinese) is required"),
  addressEn: z.string().min(1, "Address (English) is required"),
  addressZh: z.string().min(1, "Address (Chinese) is required"),
  phone: z.string().min(1, "Phone is required"),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  regionId: z.string().min(1, "Region is required"),
  open247: z.boolean().default(false),
});

type ClinicFormData = z.infer<typeof clinicFormSchema>;

function ClinicForm({ form, onSubmit, submitLabel }: {
  form: ReturnType<typeof useForm<ClinicFormData>>;
  onSubmit: (data: ClinicFormData) => void;
  submitLabel: string;
}) {
  const { data: regions } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-300"><strong>Essential Information:</strong> Help pet owners contact you quickly during emergencies.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nameEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clinic Name (English) *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Central Animal Clinic" data-testid="input-name-en" />
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
                <FormLabel>Clinic Name (Chinese) *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="中環動物診所" data-testid="input-name-zh" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="addressEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address (English) *</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="123 Queen's Road Central" rows={2} data-testid="input-address-en" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addressZh"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address (Chinese) *</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="皇后大道中123號" rows={2} data-testid="input-address-zh" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
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
                    <SelectItem key={region.id} value={region.id} data-testid={`region-${region.code}`}>
                      {region.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+852 1234 5678" data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
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
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="info@clinic.com" type="email" data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="open247"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">24-Hour Operation</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                  data-testid="switch-24hour"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" data-testid="button-submit-clinic">
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function AdminClinicsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState<Clinic | null>(null);

  const { data: clinics, isLoading: clinicsLoading, refetch } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const form = useForm<ClinicFormData>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      nameEn: "",
      nameZh: "",
      addressEn: "",
      addressZh: "",
      phone: "",
      whatsapp: "",
      email: "",
      regionId: "",
      open247: false,
    },
  });

  const createClinicMutation = useMutation({
    mutationFn: async (data: ClinicFormData) => {
      return apiRequest("POST", `/api/clinics`, data);
    },
    onSuccess: () => {
      toast({ title: "Clinic created successfully" });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Error creating clinic", description: error.message, variant: "destructive" });
    },
  });

  const updateClinicMutation = useMutation({
    mutationFn: async (data: ClinicFormData) => {
      if (!editingClinic?.id) throw new Error("No clinic selected");
      return apiRequest("PATCH", `/api/clinics/${editingClinic.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Clinic updated successfully" });
      setEditingClinic(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Error updating clinic", description: error.message, variant: "destructive" });
    },
  });

  const deleteClinicMutation = useMutation({
    mutationFn: async (clinicId: string) => {
      return apiRequest("DELETE", `/api/clinics/${clinicId}`, {});
    },
    onSuccess: () => {
      toast({ title: "Clinic deleted successfully" });
      setClinicToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Error deleting clinic", description: error.message, variant: "destructive" });
    },
  });

  const filteredClinics = clinics?.filter((clinic) => {
    const matchesSearch =
      !searchQuery ||
      clinic.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.nameZh?.includes(searchQuery) ||
      clinic.addressEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.addressZh?.includes(searchQuery);
    return matchesSearch;
  });

  const handleEditClick = (clinic: Clinic) => {
    setEditingClinic(clinic);
    form.reset({
      nameEn: clinic.nameEn || "",
      nameZh: clinic.nameZh || "",
      addressEn: clinic.addressEn || "",
      addressZh: clinic.addressZh || "",
      phone: clinic.phone || "",
      whatsapp: clinic.whatsapp || "",
      email: clinic.email || "",
      regionId: clinic.regionId || "",
      open247: clinic.open247 || false,
    });
  };

  const handleCreateClick = () => {
    form.reset({
      nameEn: "",
      nameZh: "",
      addressEn: "",
      addressZh: "",
      phone: "",
      whatsapp: "",
      email: "",
      regionId: "",
      open247: false,
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link href="/admin">
                  <Button variant="ghost" size="icon" data-testid="button-back">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2" data-testid="text-page-title">
                    <Building2 className="h-6 w-6 text-red-500" />
                    Manage Clinics
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Edit and manage all veterinary clinics
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search clinic name or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                  data-testid="input-search"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    data-testid="button-clear-search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Button onClick={handleCreateClick} data-testid="button-create-clinic">
                <Plus className="h-4 w-4 mr-2" />
                Add Clinic
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {clinicsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading clinics...</p>
            </div>
          ) : filteredClinics && filteredClinics.length > 0 ? (
            <div className="space-y-4">
              {filteredClinics.map((clinic) => (
                <Card key={clinic.id} data-testid={`card-clinic-${clinic.slug}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg" data-testid={`text-clinic-name-${clinic.slug}`}>
                            {clinic.nameEn}
                          </CardTitle>
                          {clinic.open247 && (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs" data-testid={`badge-24h-${clinic.slug}`}>
                              24-Hour
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2" data-testid={`text-clinic-address-${clinic.slug}`}>
                          {clinic.addressEn}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {clinic.phone && (
                            <div className="flex items-center gap-1" data-testid={`text-clinic-phone-${clinic.slug}`}>
                              <Phone className="h-4 w-4" />
                              {clinic.phone}
                            </div>
                          )}
                          {clinic.whatsapp && (
                            <div className="flex items-center gap-1 text-green-600" data-testid={`text-clinic-whatsapp-${clinic.slug}`}>
                              <MessageCircle className="h-4 w-4" />
                              {clinic.whatsapp}
                            </div>
                          )}
                          {clinic.email && (
                            <div className="flex items-center gap-1 text-blue-600" data-testid={`text-clinic-email-${clinic.slug}`}>
                              📧 {clinic.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {clinic.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `tel:${clinic.phone}`}
                          data-testid={`button-call-${clinic.slug}`}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      )}
                      {clinic.whatsapp && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                          onClick={() => {
                            const cleanNumber = (clinic.whatsapp || '').replace(/[^\d]/g, '');
                            window.open(`https://wa.me/${cleanNumber}`, '_blank');
                          }}
                          data-testid={`button-whatsapp-${clinic.slug}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(clinic)}
                        data-testid={`button-edit-${clinic.slug}`}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setClinicToDelete(clinic);
                          setIsDeleteDialogOpen(true);
                        }}
                        data-testid={`button-delete-${clinic.slug}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400" data-testid="text-no-results">
                  No clinics found
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Clinic Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-create-clinic">
          <DialogHeader>
            <DialogTitle>Add New Clinic</DialogTitle>
            <DialogDescription>
              Create a new veterinary clinic listing
            </DialogDescription>
          </DialogHeader>
          <ClinicForm
            form={form}
            onSubmit={(data) => createClinicMutation.mutate(data)}
            submitLabel={createClinicMutation.isPending ? "Creating..." : "Create Clinic"}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Clinic Dialog */}
      <Dialog open={!!editingClinic} onOpenChange={(open) => !open && setEditingClinic(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-edit-clinic">
          <DialogHeader>
            <DialogTitle>Edit Clinic</DialogTitle>
            <DialogDescription>
              Update clinic information
            </DialogDescription>
          </DialogHeader>
          <ClinicForm
            form={form}
            onSubmit={(data) => updateClinicMutation.mutate(data)}
            submitLabel={updateClinicMutation.isPending ? "Saving..." : "Save Changes"}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clinic?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {clinicToDelete?.nameEn}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clinicToDelete && deleteClinicMutation.mutate(clinicToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteClinicMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
