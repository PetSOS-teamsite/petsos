import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export default function ClinicOwnerEditPage() {
  const { toast } = useToast();
  const [match, params] = useRoute("/clinic/edit/:slug");
  const [saved, setSaved] = useState(false);

  const clinicSlug = params?.slug as string;

  const { data: clinic, isLoading: clinicLoading } = useQuery<Clinic | null>({
    queryKey: ["/api/clinics", clinicSlug],
    queryFn: async () => {
      if (!clinicSlug) return null;
      const response = await fetch(`/api/clinics?slug=${clinicSlug}`);
      if (!response.ok) return null;
      const clinics = await response.json();
      return clinics.find((c: Clinic) => c.slug === clinicSlug) || null;
    },
    enabled: !!clinicSlug,
  });

  const { data: regions } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
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

  // Load clinic data into form
  React.useEffect(() => {
    if (clinic) {
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
    }
  }, [clinic]);

  const updateMutation = useMutation({
    mutationFn: async (data: ClinicFormData) => {
      if (!clinic?.id) throw new Error("Clinic not found");
      return apiRequest("PATCH", `/api/clinics/${clinic.id}`, data);
    },
    onSuccess: () => {
      setSaved(true);
      toast({ title: "Clinic information saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error: any) => {
      toast({ title: "Error saving clinic", description: error.message, variant: "destructive" });
    },
  });

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Clinic not found</p>
      </div>
    );
  }

  if (clinicLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Clinic not found</p>
              <p className="text-sm text-gray-400">Please check the clinic link and try again.</p>
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
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Clinic Information</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your clinic details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update your clinic name and address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinic Name (English) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Central Animal Clinic" />
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
                          <Input {...field} placeholder="中環動物診所" />
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
                          <Textarea {...field} placeholder="123 Queen's Road Central" rows={2} />
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
                          <Textarea {...field} placeholder="皇后大道中123號" rows={2} />
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How customers can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+852 1234 5678" />
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
                          <Input {...field} value={field.value || ""} placeholder="+852 1234 5678" />
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
                          <Input {...field} value={field.value || ""} placeholder="info@clinic.com" type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operations</CardTitle>
                <CardDescription>Set your operating hours</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="open247"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">24-Hour Operation</FormLabel>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Enable if your clinic operates 24/7</p>
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
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
                size="lg"
              >
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
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
