import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Loader2, Check, Clock, Lock } from "lucide-react";
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
  regionId: z.string().min(1, "Region is required"),
  open247: z.boolean().default(true),
});

type HospitalFormData = z.infer<typeof hospitalFormSchema>;

export default function HospitalOwnerEditVerifiedPage() {
  const { toast } = useToast();
  const [match, params] = useRoute("/hospital/edit/:slug");
  const [verified, setVerified] = useState(false);
  const [saved, setSaved] = useState(false);

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
      regionId: "",
      open247: true,
    },
  });

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
        regionId: hospital.regionId || "",
        open247: hospital.open247 || true,
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
      return apiRequest("PATCH", `/api/hospitals/${hospital.id}`, data);
    },
    onSuccess: () => {
      setSaved(true);
      toast({ title: "Hospital information saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error: any) => {
      toast({ title: "Error saving hospital", description: error.message, variant: "destructive" });
    },
  });

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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
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
              <Button variant="ghost" size="icon">
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

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Form {...hospitalForm}>
          <form onSubmit={hospitalForm.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={hospitalForm.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospital Name (English) *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={hospitalForm.control}
                    name="addressEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (English) *</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} />
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
                          <Textarea {...field} rows={2} />
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
                          <SelectTrigger>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={hospitalForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
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
                          <Input {...field} value={field.value || ""} />
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
                          <Input {...field} value={field.value || ""} type="email" />
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
              </CardHeader>
              <CardContent>
                <FormField
                  control={hospitalForm.control}
                  name="open247"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">24-Hour Operation</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value || true} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button type="submit" disabled={updateMutation.isPending} className="w-full" size="lg">
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
