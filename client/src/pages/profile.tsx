import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { User, Phone, Mail, Globe, MapPin, Save, ArrowLeft, Download, Shield, Trash2, AlertTriangle, Edit, PawPrint } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { User as UserType, Region, Pet } from "@shared/schema";

const createProfileSchema = (t: (key: string, fallback: string) => string) => z.object({
  name: z.string().min(1, t("profile.validation.name", "Name is required")).optional().or(z.literal('')),
  email: z.string().email(t("profile.validation.email", "Please enter a valid email")),
  phone: z.string().min(1, t("profile.validation.phone_required", "Phone number is required"))
    .min(8, t("profile.validation.phone_length", "Please enter a valid phone number (at least 8 digits)")),
  languagePreference: z.enum(['en', 'zh-HK']),
  regionPreference: z.string().optional(),
});

type ProfileSchemaType = ReturnType<typeof createProfileSchema>;
type ProfileFormData = z.infer<ProfileSchemaType>;

export default function ProfilePage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const { setLanguage } = useLanguage();
  
  const profileSchema = createProfileSchema(t);

  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ['/api/users', authUser?.id],
    enabled: !!authUser?.id,
  });

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ['/api/regions'],
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ['/api/pets'],
    enabled: !!authUser?.id,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      languagePreference: 'en',
      regionPreference: undefined,
    },
    values: user ? {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      languagePreference: (user.languagePreference as 'en' | 'zh-HK') || 'en',
      regionPreference: user.regionPreference || undefined,
    } : undefined,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest(
        'PATCH',
        `/api/users/${authUser?.id}`,
        data
      );
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', authUser?.id] });
      // Update LanguageContext when language preference changes
      if (variables.languagePreference) {
        setLanguage(variables.languagePreference);
      }
      toast({
        title: t("profile.success.title", "Profile updated successfully!"),
        description: t("profile.success.desc", "Your changes have been saved."),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.error.title", "Update failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/users/export', {
        credentials: 'include',
      });

      // Handle error responses first (before calling blob)
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to export data');
        }
        throw new Error('Failed to export data');
      }

      // Validate response is JSON
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format');
      }

      // Verify this is a download (has Content-Disposition header)
      const disposition = response.headers.get('Content-Disposition');
      if (!disposition) {
        throw new Error('Invalid download response');
      }

      // Extract filename from Content-Disposition header
      let filename = `petsos-data-export-${new Date().toISOString()}.json`;
      const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t("profile.export.success_title", "Data exported successfully"),
        description: t("profile.export.success_desc", "Your personal data has been downloaded."),
      });
    } catch (error) {
      toast({
        title: t("profile.export.error_title", "Export failed"),
        description: t("profile.export.error_desc", "Failed to download your data. Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await apiRequest('DELETE', '/api/users/gdpr-delete');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      toast({
        title: t("profile.delete.success_title", "Account deleted"),
        description: t("profile.delete.success_desc", "Your account and all data have been permanently deleted."),
      });

      // Redirect to home after deletion
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    } catch (error: any) {
      toast({
        title: t("profile.delete.error_title", "Deletion failed"),
        description: error.message || t("profile.delete.error_desc", "Failed to delete your account. Please try again."),
        variant: "destructive",
      });
    }
  };

  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">{t("loading.profile", "Loading profile...")}</div>
      </div>
    );
  }

  if (!authUser) {
    setLocation('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("button.back_home", "Back to Home")}
            </Button>
          </Link>
        </div>

        {/* Pet Management Section - TOP PRIORITY */}
        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <PawPrint className="w-6 h-6" />
              {t("profile.pets_cta.title", "Your Pets")} {pets.length > 0 && `(${pets.length})`}
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-400">
              {t("profile.pets_cta.desc", "Save your pet profiles for faster emergency help")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {petsLoading ? (
              <div className="text-sm text-green-700 dark:text-green-400">
                {t("loading.pets", "Loading pets...")}
              </div>
            ) : pets.length > 0 ? (
              <>
                <div className="space-y-3">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800"
                      data-testid={`pet-card-${pet.id}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-2xl">
                        {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : pet.species === 'bird' ? '🦜' : pet.species === 'rabbit' ? '🐰' : pet.species === 'hamster' ? '🐹' : '🐾'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`pet-name-${pet.id}`}>
                          {pet.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`pet-info-${pet.id}`}>
                          {pet.breed} {pet.age && `• ${pet.age} ${t("pets.years", "years")}`}
                        </p>
                      </div>
                      <Link href="/pets">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-pet-${pet.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                <Link href="/pets">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                    size="lg"
                    data-testid="button-add-pet"
                  >
                    <PawPrint className="w-5 h-5 mr-2" />
                    {t("profile.pets_cta.add_another", "Add Another Pet")}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <PawPrint className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    {t("profile.pets_empty.title", "No pets yet")}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-400 mb-4">
                    {t("profile.pets_empty.desc", "Add your first furry kid for faster emergency help. It only takes 30 seconds!")}
                  </p>
                </div>
                <Link href="/pets">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                    size="lg"
                    data-testid="button-add-first-pet"
                  >
                    <PawPrint className="w-5 h-5 mr-2" />
                    {t("profile.pets_cta.button", "Add or Manage Pets")}
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Personal Information - Simplified */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-6 h-6" />
              {t("profile.title", "My Profile")}
            </CardTitle>
            <CardDescription>
              {t("profile.desc", "Manage your account information and preferences")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.name", "Name")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              {...field}
                              className="pl-10"
                              placeholder={t("profile.name_placeholder", "Enter your name")}
                              data-testid="input-name"
                            />
                          </div>
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
                        <FormLabel>{t("profile.email", "Email")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              {...field}
                              type="email"
                              className="pl-10"
                              placeholder={t("profile.email_placeholder", "you@example.com")}
                              data-testid="input-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("profile.phone", "Phone Number")}
                          <span className="text-red-600 dark:text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              {...field}
                              type="tel"
                              className="pl-10"
                              placeholder={t("profile.phone_placeholder", "+852 1234 5678")}
                              data-testid="input-phone"
                              required
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Collapsible Settings */}
                <Accordion type="single" collapsible className="border rounded-lg">
                  <AccordionItem value="settings" className="border-0">
                    <AccordionTrigger className="px-4 hover:no-underline" data-testid="accordion-settings">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span>{t("profile.settings", "Language & Region Settings")}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="languagePreference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("profile.language", "Language Preference")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-language">
                                  <Globe className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                  <SelectValue placeholder={t("profile.language_placeholder", "Select language")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en" data-testid="option-en">English</SelectItem>
                                <SelectItem value="zh-HK" data-testid="option-zh">繁體中文</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="regionPreference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("profile.region", "Region Preference")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-region">
                                  <MapPin className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                  <SelectValue placeholder={t("profile.region_placeholder", "Select region")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {regions.map((region) => (
                                  <SelectItem key={region.id} value={region.id} data-testid={`option-region-${region.code}`}>
                                    {language === "en" ? region.nameEn : region.nameZh}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? t("profile.saving", "Saving...") : t("profile.save", "Save Changes")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Privacy & Data Rights - Moved to Bottom */}
        <Card className="mt-6 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Shield className="w-5 h-5" />
              {t("profile.privacy.title", "Privacy & Data Rights")}
            </CardTitle>
            <CardDescription>
              {t("profile.privacy.desc", "Manage your personal data and privacy settings")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="privacy">
                <AccordionTrigger data-testid="accordion-privacy">
                  {t("profile.privacy.expand", "View privacy options")}
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-2">
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("profile.privacy.export_title", "Export Your Data")}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {t("profile.privacy.export_desc", "Download a copy of all your personal data in JSON format (GDPR/PDPO compliant)")}
                    </p>
                    <Button
                      onClick={handleExportData}
                      variant="outline"
                      className="w-full"
                      data-testid="button-export-data"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t("profile.privacy.export_button", "Download My Data")}
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("profile.privacy.delete_title", "Delete Your Account")}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {t("profile.privacy.delete_desc", "Permanently delete your account and all associated data. This action cannot be undone.")}
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full"
                          data-testid="button-delete-account"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("profile.privacy.delete_button", "Delete My Account")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
                            {t("profile.delete.dialog_title", "Are you absolutely sure?")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("profile.delete.dialog_desc", "This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:")}
                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                              <li>{t("profile.delete.dialog_item1", "Your profile and contact information")}</li>
                              <li>{t("profile.delete.dialog_item2", "All saved pets and their medical history")}</li>
                              <li>{t("profile.delete.dialog_item3", "All emergency request records")}</li>
                              <li>{t("profile.delete.dialog_item4", "All privacy consents and preferences")}</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">
                            {t("profile.delete.dialog_cancel", "Cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                            data-testid="button-confirm-delete"
                          >
                            {t("profile.delete.dialog_confirm", "Yes, delete my account")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
