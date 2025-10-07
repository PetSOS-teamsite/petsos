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
import { User, Phone, Mail, Globe, MapPin, Save, ArrowLeft, Download, Shield, Trash2, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { User as UserType, Region } from "@shared/schema";

const createProfileSchema = (t: (key: string, fallback: string) => string) => z.object({
  username: z.string().min(3, t("profile.validation.username", "Username must be at least 3 characters")).optional().or(z.literal('')),
  email: z.string().email(t("profile.validation.email", "Please enter a valid email")),
  phone: z.string().min(8, t("profile.validation.phone", "Please enter a valid phone number")),
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

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
      languagePreference: 'en',
      regionPreference: undefined,
    },
    values: user ? {
      username: user.username || '',
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">{t("loading.profile", "Loading profile...")}</div>
      </div>
    );
  }

  if (!authUser) {
    setLocation('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("button.back_home", "Back to Home")}
            </Button>
          </Link>
        </div>

        <Card>
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
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.username", "Username")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            {...field}
                            className="pl-10"
                            placeholder={t("profile.username_placeholder", "Enter username")}
                            data-testid="input-username"
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
                      <FormLabel>{t("profile.phone", "Phone Number")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            {...field}
                            type="tel"
                            className="pl-10"
                            placeholder={t("profile.phone_placeholder", "+852 1234 5678")}
                            data-testid="input-phone"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-500" />
              {t("profile.privacy.title", "Privacy & Data Rights")}
            </CardTitle>
            <CardDescription>
              {t("profile.privacy.desc", "Manage your personal data and privacy settings")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
          </CardContent>
        </Card>

        <div className="mt-6">
          <Link href="/pets">
            <Button variant="outline" className="w-full" data-testid="button-manage-pets">
              {t("profile.manage_pets", "Manage My Pets")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
