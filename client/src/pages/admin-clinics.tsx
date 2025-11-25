import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2, Building2, Clock, CheckCircle2, AlertCircle, Loader2, Search, X, Activity, MessageCircle, Phone, Copy, ExternalLink, Check as CheckIcon } from "lucide-react";
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
import { formatDate } from "@/lib/dateFormat";
import type { Clinic, Region } from "@shared/schema";

const clinicFormSchema = z.object({
  name: z.string().min(1, "Clinic name (English) is required"),
  nameZh: z.string().min(1, "Clinic name (Chinese) is required"),
  address: z.string().min(1, "Address (English) is required"),
  addressZh: z.string().min(1, "Address (Chinese) is required"),
  phone: z.string().min(1, "Phone is required"),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  regionId: z.string().min(1, "Region is required"),
  is24Hour: z.boolean().default(false),
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
            name="name"
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
            name="address"
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
          name="is24Hour"
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  const { data: clinics, isLoading: clinicsLoading, refetch } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const form = useForm<ClinicFormData>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: "",
      nameZh: "",
      address: "",
      addressZh: "",
      phone: "",
      whatsapp: "",
      email: "",
      regionId: "",
      is24Hour: false,
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
      clinic.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.nameZh?.includes(searchQuery) ||
      clinic.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.addressZh?.includes(searchQuery);
    return matchesSearch;
  });

  const handleEditClick = (clinic: Clinic) => {
    setEditingClinic(clinic);
    form.reset({
      name: clinic.name || "",
      nameZh: clinic.nameZh || "",
      address: clinic.address || "",
      addressZh: clinic.addressZh || "",
      phone: clinic.phone || "",
      whatsapp: clinic.whatsapp || "",
      email: clinic.email || "",
      regionId: clinic.regionId || "",
      is24Hour: clinic.is24Hour || false,
    });
  };

  const handleCreateClick = () => {
    form.reset({
      name: "",
      nameZh: "",
      address: "",
      addressZh: "",
      phone: "",
      whatsapp: "",
      email: "",
      regionId: "",
      is24Hour: false,
    });
    setIsCreateDialogOpen(true);
  };

  const handleImportCSV = async () => {
    if (!csvData.trim()) {
      toast({ title: "Error", description: "Please paste CSV data", variant: "destructive" });
      return;
    }
    
    setIsImporting(true);
    try {
      const response = await apiRequest("POST", "/api/clinics/import", { csvData });
      setImportResults(response);
      toast({ 
        title: "Import Complete", 
        description: `Created/Updated: ${response.summary.createdOrUpdated}, Errors: ${response.summary.errors}` 
      });
      setCsvData("");
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      refetch();
      setTimeout(() => setIsImportDialogOpen(false), 1000);
    } catch (error: any) {
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvData(event.target?.result as string);
    };
    reader.readAsText(file);
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

              <Button 
                variant="outline" 
                onClick={() => setIsImportDialogOpen(true)}
                data-testid="button-import-csv"
              >
                <Plus className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white min-w-[300px]">Clinic Name & Address</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">WhatsApp</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClinics.map((clinic) => (
                    <tr 
                      key={clinic.id} 
                      data-testid={`row-clinic-${clinic.id}`}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm" data-testid={`text-clinic-name-${clinic.id}`}>
                              {clinic.name}
                            </div>
                            {clinic.nameZh && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {clinic.nameZh}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight" data-testid={`text-clinic-address-${clinic.id}`}>
                            <div>{clinic.address}</div>
                            {clinic.addressZh && (
                              <div className="text-gray-400 dark:text-gray-500">{clinic.addressZh}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap" data-testid={`text-clinic-phone-${clinic.id}`}>
                        {clinic.phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap" data-testid={`text-clinic-whatsapp-${clinic.id}`}>
                        {clinic.whatsapp || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {clinic.is24Hour ? (
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium" data-testid={`badge-24h-${clinic.id}`}>
                            24-Hour
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs" data-testid={`badge-standard-${clinic.id}`}>
                            Standard
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {clinic.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.location.href = `tel:${clinic.phone}`}
                              data-testid={`button-call-${clinic.id}`}
                              className="h-8 w-8 p-0"
                              title="Call"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          {clinic.whatsapp && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const cleanNumber = (clinic.whatsapp || '').replace(/[^\d]/g, '');
                                window.open(`https://wa.me/${cleanNumber}`, '_blank');
                              }}
                              data-testid={`button-whatsapp-${clinic.id}`}
                              className="h-8 w-8 p-0 text-green-600 dark:text-green-400 hover:text-green-700"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(clinic)}
                            data-testid={`button-edit-${clinic.id}`}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = `${window.location.origin}/clinic/edit/${clinic.id}`;
                              navigator.clipboard.writeText(link);
                              toast({ title: "Link copied", description: clinic.name });
                            }}
                            data-testid={`button-copy-link-${clinic.id}`}
                            className="h-8 w-8 p-0"
                            title="Copy Share Link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setClinicToDelete(clinic);
                              setIsDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-${clinic.id}`}
                            className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 px-4">
                Showing {filteredClinics.length} of {clinics?.length || 0} clinics
              </div>
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

      {/* Import CSV Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-import-csv">
          <DialogHeader>
            <DialogTitle>Import Clinics from CSV</DialogTitle>
            <DialogDescription>
              Upload or paste CSV data to create or update clinic records
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>CSV Format:</strong> Name of Vet Clinic (English), 獸醫診所名稱 (Chinese), Address, 營業地址, Call Phone Number, WhatsApp Number, 24 hours, District
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload CSV File</label>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                data-testid="input-csv-file"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or paste CSV data</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">CSV Data</label>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="Paste your CSV data here..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                data-testid="textarea-csv-data"
              />
            </div>

            {importResults && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-300">
                  <strong>Import Results:</strong> {importResults.summary.createdOrUpdated} created/updated, {importResults.summary.errors} errors
                </p>
                {importResults.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <p className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">Errors:</p>
                    {importResults.errors.slice(0, 5).map((err: string, idx: number) => (
                      <p key={idx} className="text-xs text-green-600 dark:text-green-400">{err}</p>
                    ))}
                    {importResults.errors.length > 5 && (
                      <p className="text-xs text-green-600 dark:text-green-400">... and {importResults.errors.length - 5} more errors</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setCsvData("");
                setImportResults(null);
              }}
              data-testid="button-cancel-import"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportCSV}
              disabled={!csvData.trim() || isImporting}
              data-testid="button-import"
            >
              {isImporting ? "Importing..." : "Import Clinics"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
