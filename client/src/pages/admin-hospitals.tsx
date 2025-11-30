import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2, Building2, Clock, CheckCircle2, AlertCircle, MapPin, Loader2, Search, X, Activity, Image as ImageIcon, Upload, XCircle, Copy, ExternalLink, KeyRound } from "lucide-react";
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
import { useForm, useController, Control, FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHospitalSchema, type Hospital, type Region } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/dateFormat";

// Helper functions for comma-separated arrays
const parseCommaList = (text: string): string[] | null => {
  const values = text.split(",").map(v => v.trim()).filter(v => v);
  return values.length > 0 ? values : null;
};

const joinCommaList = (arr: string[] | null | undefined): string => {
  return (arr || []).join(", ");
};

// Component for comma-separated array input
function CommaArrayField({ 
  control,
  name,
  label,
  placeholder,
  description,
  testId 
}: {
  control: Control<any>;
  name: FieldPath<any>;
  label: string;
  placeholder: string;
  description: string;
  testId: string;
}) {
  const { field } = useController({ control, name });
  const [textValue, setTextValue] = useState(joinCommaList(field.value as string[]));

  // Resync text when field.value changes (e.g., on form reset)
  useEffect(() => {
    setTextValue(joinCommaList(field.value as string[]));
  }, [field.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setTextValue(newText);
    field.onChange(parseCommaList(newText));
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input
          value={textValue}
          onChange={handleChange}
          placeholder={placeholder}
          data-testid={testId}
        />
      </FormControl>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
}

const hospitalFormSchema = insertHospitalSchema.extend({
  nameEn: z.string().min(1, "Hospital name (English) is required"),
  nameZh: z.string().min(1, "Hospital name (Chinese) is required"),
  addressEn: z.string().min(1, "Address (English) is required"),
  addressZh: z.string().min(1, "Address (Chinese) is required"),
  regionId: z.string().min(1, "Region is required"),
  slug: z.string().min(1, "URL slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
});

type HospitalFormData = z.infer<typeof hospitalFormSchema>;

function HospitalForm({ form, onSubmit, submitLabel }: { 
  form: ReturnType<typeof useForm<HospitalFormData>>;
  onSubmit: (data: HospitalFormData) => void;
  submitLabel: string;
}) {
  const { data: regions } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  const photos = form.watch("photos") as string[] | null;

  const addPhoto = () => {
    if (newPhotoUrl.trim()) {
      const currentPhotos = (photos || []) as string[];
      form.setValue("photos", [...currentPhotos, newPhotoUrl.trim()] as any, { 
        shouldDirty: true, 
        shouldTouch: true 
      });
      setNewPhotoUrl("");
    }
  };

  const removePhoto = (index: number) => {
    const currentPhotos = (photos || []) as string[];
    form.setValue("photos", currentPhotos.filter((_, i) => i !== index) as any, { 
      shouldDirty: true, 
      shouldTouch: true 
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="medical">Medical Services</TabsTrigger>
            <TabsTrigger value="operational">Operational</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-300"><strong>Essential Information:</strong> Help pet parents contact you quickly during emergencies. Complete this first, then add photos and services to increase visibility.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hospital Name (English) *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Central Animal Hospital" data-testid="input-name-en" />
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
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="central-animal-hospital" data-testid="input-slug" />
                  </FormControl>
                  <FormDescription>Lowercase letters, numbers, and hyphens only</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="addressEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (English) *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="123 Queen's Road Central" rows={3} data-testid="input-address-en" />
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
                      <Textarea {...field} placeholder="皇后大道中123號" rows={3} data-testid="input-address-zh" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="+852 1234 5678" data-testid="input-phone" />
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
                    <FormLabel>WhatsApp *</FormLabel>
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="info@hospital.com" type="email" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hospital Photos</CardTitle>
                <CardDescription>Add photos of the hospital to help pet owners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter photo URL (e.g., https://example.com/photo.jpg)"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
                    data-testid="input-photo-url"
                  />
                  <Button type="button" onClick={addPhoto} data-testid="button-add-photo">
                    <Upload className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {photos && photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
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
                          onClick={() => removePhoto(index)}
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
                    <p className="text-sm">Add photo URLs above to display them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parking"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Parking Available</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wheelchairAccess"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Wheelchair Accessible</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isolationWard"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Isolation Ward</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ambulanceSupport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ambulance Support</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eolSupport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">End-of-Life Support</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsappTriage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">WhatsApp Triage</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="icuLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ICU Level</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g., Level 2 ICU" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Medical Services Tab - Optional */}
          <TabsContent value="medical" className="space-y-4">
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-300"><strong>Optional:</strong> Help pet parents find you during emergencies by listing your medical services and capabilities.</p>
            </div>
            <h3 className="text-lg font-semibold">Imaging Services</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imagingXray"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">X-Ray</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imagingUS"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ultrasound</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imagingCT"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">CT Scan</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sameDayCT"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Same-Day CT</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <h3 className="text-lg font-semibold mt-6">Laboratory & Testing</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inHouseLab"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">In-House Laboratory</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="extLabCutoff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Lab Cutoff Time</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="e.g., 6:00 PM" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bloodBankAccess"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Bank Access</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g., On-site blood bank" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h3 className="text-lg font-semibold mt-6">Surgery Capabilities</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sxEmergencySoft"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Emergency Soft Tissue Surgery</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sxEmergencyOrtho"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Emergency Orthopedic Surgery</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <h3 className="text-lg font-semibold mt-6">Life Support Equipment</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="oxygenTherapy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Oxygen Therapy / Tanks</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ventilator"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ventilator / Respirator</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodTransfusion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Blood Bank (transfusion support)</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imagingMRI"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">MRI Imaging</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endoscopy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Endoscopy</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dialysis"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Dialysis / Renal Support</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defibrillator"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Defibrillator / AED</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="anaesMonitoring"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anesthesia Monitoring</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g., Advanced monitoring equipment" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialistAvail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialist Availability</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="List available specialists" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Operational Tab - Optional */}
          <TabsContent value="operational" className="space-y-4">
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-300"><strong>Optional:</strong> Share operational details like visiting hours, facilities, and support options to build trust with pet owners.</p>
            </div>
            <FormField
              control={form.control}
              name="onSiteVet247"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">On-Site Vet 24/7</FormLabel>
                    <FormDescription>Is a veterinarian on-site 24 hours?</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nurse24h"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">24-Hour Nursing</FormLabel>
                    <FormDescription>Are nurses available 24 hours?</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="triagePolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Triage Policy</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Describe triage process" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="typicalWaitBand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typical Wait Time</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select wait time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="<30min">&lt; 30 minutes</SelectItem>
                      <SelectItem value="30-60min">30-60 minutes</SelectItem>
                      <SelectItem value="1-2hr">1-2 hours</SelectItem>
                      <SelectItem value=">2hr">&gt; 2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerVisitPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Visiting Policy</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Describe visiting hours and policies" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recheckWindow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recheck Window</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g., 48 hours" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h3 className="text-lg font-semibold mt-6">Client Support</h3>
            
            <CommaArrayField
              control={form.control}
              name="languages"
              label="Languages Spoken"
              placeholder="e.g., English, Cantonese, Mandarin, Japanese"
              description="Comma-separated list of languages spoken by staff"
              testId="input-languages"
            />

            <h3 className="text-lg font-semibold mt-6">Payment & Insurance</h3>
            
            <FormField
              control={form.control}
              name="admissionDeposit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Requires Admission Deposit</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="depositBand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Range</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select deposit range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="<5k">&lt; HK$5,000</SelectItem>
                      <SelectItem value="5-10k">HK$5,000 - 10,000</SelectItem>
                      <SelectItem value="10-20k">HK$10,000 - 20,000</SelectItem>
                      <SelectItem value=">20k">&gt; HK$20,000</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="refundPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Policy</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Describe refund policy" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CommaArrayField
              control={form.control}
              name="payMethods"
              label="Payment Methods Accepted"
              placeholder="e.g., Cash, Credit Card, PayMe, FPS, Octopus"
              description="Comma-separated list of accepted payment methods"
              testId="input-pay-methods"
            />

            <CommaArrayField
              control={form.control}
              name="insuranceSupport"
              label="Insurance Providers Supported"
              placeholder="e.g., Blue Cross, OneDegree, Petclaim, Pawpular"
              description="Comma-separated list of insurance providers supported"
              testId="input-insurance-support"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="submit" data-testid="button-submit">{submitLabel}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function AdminHospitalsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitalForCode, setHospitalForCode] = useState<Hospital | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
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
    withPhotos: (hospitals?.filter(h => h.photos && (h.photos as any[]).length > 0) ?? []).length,
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
      email: null,
      websiteUrl: null,
      open247: true,
      isAvailable: true,
      isPartner: false,
      latitude: null,
      longitude: null,
      photos: [],
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
      oxygenTherapy: null,
      ventilator: null,
      bloodTransfusion: null,
      imagingMRI: null,
      endoscopy: null,
      dialysis: null,
      defibrillator: null,
      whatsappTriage: null,
      parking: null,
      wheelchairAccess: null,
      admissionDeposit: null,
      depositBand: null,
      recheckWindow: null,
      refundPolicy: null,
      speciesAccepted: null,
      languages: null,
      payMethods: null,
      insuranceSupport: null,
    },
  });

  const editForm = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalFormSchema),
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
      email: hospital.email || null,
      websiteUrl: hospital.websiteUrl || null,
      open247: hospital.open247,
      isAvailable: hospital.isAvailable,
      isPartner: hospital.isPartner,
      latitude: hospital.latitude ? String(hospital.latitude) : null,
      longitude: hospital.longitude ? String(hospital.longitude) : null,
      photos: hospital.photos || [],
      liveStatus: hospital.liveStatus ?? null,
      onSiteVet247: hospital.onSiteVet247 ?? null,
      triagePolicy: hospital.triagePolicy ?? null,
      typicalWaitBand: hospital.typicalWaitBand ?? null,
      isolationWard: hospital.isolationWard ?? null,
      ambulanceSupport: hospital.ambulanceSupport ?? null,
      icuLevel: hospital.icuLevel ?? null,
      nurse24h: hospital.nurse24h ?? null,
      ownerVisitPolicy: hospital.ownerVisitPolicy ?? null,
      eolSupport: hospital.eolSupport ?? null,
      imagingXray: hospital.imagingXray ?? null,
      imagingUS: hospital.imagingUS ?? null,
      imagingCT: hospital.imagingCT ?? null,
      sameDayCT: hospital.sameDayCT ?? null,
      inHouseLab: hospital.inHouseLab ?? null,
      extLabCutoff: hospital.extLabCutoff ?? null,
      bloodBankAccess: hospital.bloodBankAccess ?? null,
      sxEmergencySoft: hospital.sxEmergencySoft ?? null,
      sxEmergencyOrtho: hospital.sxEmergencyOrtho ?? null,
      anaesMonitoring: hospital.anaesMonitoring ?? null,
      specialistAvail: hospital.specialistAvail ?? null,
      oxygenTherapy: hospital.oxygenTherapy ?? null,
      ventilator: hospital.ventilator ?? null,
      bloodTransfusion: hospital.bloodTransfusion ?? null,
      imagingMRI: hospital.imagingMRI ?? null,
      endoscopy: hospital.endoscopy ?? null,
      dialysis: hospital.dialysis ?? null,
      defibrillator: hospital.defibrillator ?? null,
      whatsappTriage: hospital.whatsappTriage ?? null,
      parking: hospital.parking ?? null,
      wheelchairAccess: hospital.wheelchairAccess ?? null,
      admissionDeposit: hospital.admissionDeposit ?? null,
      depositBand: hospital.depositBand ?? null,
      recheckWindow: hospital.recheckWindow ?? null,
      refundPolicy: hospital.refundPolicy ?? null,
      speciesAccepted: hospital.speciesAccepted ?? null,
      languages: hospital.languages ?? null,
      payMethods: hospital.payMethods ?? null,
      insuranceSupport: hospital.insuranceSupport ?? null,
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

  const generateCodeMutation = useMutation({
    mutationFn: async (hospitalId: string) => {
      const response = await apiRequest("POST", `/api/hospitals/${hospitalId}/generate-code`, {});
      const data = await response.json();
      return data.code;
    },
    onSuccess: (code: string) => {
      setGeneratedCode(code);
      setIsCodeDialogOpen(true);
      toast({ title: "Code generated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error generating code", description: error.message, variant: "destructive" });
    },
  });

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
          <p className="text-muted-foreground">Manage 24-hour animal hospital profiles with photos and facilities</p>
        </div>
        <Button onClick={openAddDialog} data-testid="button-add-hospital">
          <Plus className="h-4 w-4 mr-2" />
          Add Hospital
        </Button>
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
            <CardTitle className="text-sm font-medium">With Photos</CardTitle>
            <ImageIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withPhotos}</div>
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
          <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages || 1}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedHospitals.map((hospital) => {
              const region = regions?.find(r => r.id === hospital.regionId);
              const photos = hospital.photos as string[] | null;
              return (
                <div
                  key={hospital.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  data-testid={`hospital-card-${hospital.id}`}
                >
                  <div className="flex gap-4">
                    {photos && photos.length > 0 && (
                      <img
                        src={photos[0]}
                        alt={hospital.nameEn}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
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
                        {photos && photos.length > 0 && (
                          <Badge variant="outline">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{hospital.nameZh}</p>
                      <p className="text-sm mb-1">{hospital.addressEn}</p>
                      <div className="flex items-center gap-4 text-sm mt-2">
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
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHospitalForCode(hospital);
                          setGeneratedCode(null);
                          generateCodeMutation.mutate(hospital.id);
                        }}
                        data-testid={`button-generate-code-${hospital.id}`}
                        title={hospital.slug ? "Generate Access Code" : "Add URL slug first to enable access codes"}
                        disabled={generateCodeMutation.isPending || !hospital.slug}
                      >
                        {generateCodeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                      </Button>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Hospital</DialogTitle>
            <DialogDescription>Enter the hospital details including photos and facilities</DialogDescription>
          </DialogHeader>
          <HospitalForm form={addForm} onSubmit={handleAddHospital} submitLabel="Add Hospital" />
        </DialogContent>
      </Dialog>

      {/* Edit Hospital Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Hospital</DialogTitle>
            <DialogDescription>Update the hospital details</DialogDescription>
          </DialogHeader>
          <HospitalForm form={editForm} onSubmit={handleEditHospital} submitLabel="Save Changes" />
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

      {/* Generated Code Dialog */}
      <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generated Code</DialogTitle>
            <DialogDescription>
              Share this code with the hospital owner to access their edit link
            </DialogDescription>
          </DialogHeader>
          {generatedCode && hospitalForCode && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Access Code:</p>
                <p className="text-3xl font-mono font-bold text-red-600 dark:text-red-400 text-center tracking-widest">
                  {generatedCode}
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Edit Link:</p>
                <p className="text-sm font-mono break-all text-blue-600 dark:text-blue-400">
                  {`${window.location.origin}/hospital/edit/${hospitalForCode.slug}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    toast({ title: "Code copied to clipboard" });
                  }}
                  className="flex-1"
                  data-testid="button-copy-code"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = `${window.location.origin}/hospital/edit/${hospitalForCode.slug}`;
                    navigator.clipboard.writeText(link);
                    toast({ title: "Link copied to clipboard" });
                  }}
                  className="flex-1"
                  data-testid="button-copy-link"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
