import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { PhoneInput } from "@/components/PhoneInput";
import { User, Phone, Mail, Globe, MapPin, Save, ArrowLeft, Download, Shield, Trash2, AlertTriangle, Edit, PawPrint, Bell, Megaphone, Sparkles, AlertCircle, Lightbulb, Lock, Key, Copy, Check, RefreshCw } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { User as UserType, Region, Pet, NotificationPreferences, Country } from "@shared/schema";

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
  const [countryCode, setCountryCode] = useState("+852"); // Default to Hong Kong
  
  const profileSchema = createProfileSchema(t);

  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ['/api/users', authUser?.id],
    enabled: !!authUser?.id,
  });

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ['/api/regions'],
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ['/api/countries'],
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ['/api/users', authUser?.id, 'pets'],
    enabled: !!authUser?.id,
  });

  // Notification preferences query
  const { data: notificationPrefs, isLoading: notificationPrefsLoading } = useQuery<NotificationPreferences>({
    queryKey: ['/api/users', authUser?.id, 'notification-preferences'],
    enabled: !!authUser?.id,
  });

  // Notification preferences mutation
  const updateNotificationPrefsMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      const response = await apiRequest(
        'PATCH',
        `/api/users/${authUser?.id}/notification-preferences`,
        prefs
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', authUser?.id, 'notification-preferences'] });
      toast({
        title: t("profile.notifications.success", "Notification preferences updated"),
        description: t("profile.notifications.success_desc", "Your notification settings have been saved."),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.notifications.error", "Update failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNotificationToggle = (key: keyof NotificationPreferences, value: boolean) => {
    updateNotificationPrefsMutation.mutate({ [key]: value });
  };

  // Two-Factor Authentication state and queries (admin only)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState('');
  
  const isAdmin = user?.role === 'admin';
  
  const { data: twoFactorStatus, isLoading: twoFactorStatusLoading } = useQuery<{
    enabled: boolean;
    hasBackupCodes: boolean;
    backupCodesCount: number;
  }>({
    queryKey: ['/api/auth/2fa/status'],
    enabled: !!authUser?.id && isAdmin,
  });
  
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/2fa/setup', {});
      return await response.json();
    },
    onSuccess: (data) => {
      setTwoFactorSetupData({ qrCode: data.qrCode, secret: data.secret });
      setShowTwoFactorSetup(true);
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.2fa.setup_error", "Setup failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const verify2FAMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/auth/2fa/verify', { code });
      return await response.json();
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setShowTwoFactorSetup(false);
      setTwoFactorCode('');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/2fa/status'] });
      toast({
        title: t("profile.2fa.enabled_title", "2FA Enabled"),
        description: t("profile.2fa.enabled_desc", "Two-factor authentication has been enabled. Save your backup codes."),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.2fa.verify_error", "Verification failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const disable2FAMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/auth/2fa/disable', { code });
      return await response.json();
    },
    onSuccess: () => {
      setShowDisable2FADialog(false);
      setDisable2FACode('');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/2fa/status'] });
      toast({
        title: t("profile.2fa.disabled_title", "2FA Disabled"),
        description: t("profile.2fa.disabled_desc", "Two-factor authentication has been disabled."),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.2fa.disable_error", "Disable failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const regenerateBackupCodesMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/auth/2fa/backup-codes', { code });
      return await response.json();
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/2fa/status'] });
      toast({
        title: t("profile.2fa.codes_regenerated", "Backup Codes Regenerated"),
        description: t("profile.2fa.codes_regenerated_desc", "New backup codes have been generated. Save them securely."),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.2fa.regenerate_error", "Failed to regenerate codes"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleCopyBackupCodes = () => {
    if (backupCodes) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    }
  };

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      languagePreference: 'en',
      regionPreference: undefined,
    },
  });

  // Parse phone number to extract country code when user data loads
  useEffect(() => {
    if (user && countries.length > 0) {
      form.setValue('name', user.name || '');
      form.setValue('email', user.email || '');
      form.setValue('languagePreference', (user.languagePreference as 'en' | 'zh-HK') || 'en');
      form.setValue('regionPreference', user.regionPreference || undefined);
      
      // Parse phone number to extract country code
      if (user.phone) {
        const phone = user.phone.trim();
        if (phone.startsWith('+')) {
          // Get all valid phone prefixes and sort by length (longest first)
          const validPrefixes = countries
            .map(c => c.phonePrefix)
            .filter(Boolean)
            .sort((a, b) => (b?.length || 0) - (a?.length || 0));
          
          // Find the first matching prefix
          const matchingPrefix = validPrefixes.find(prefix => prefix && phone.startsWith(prefix));
          
          if (matchingPrefix) {
            setCountryCode(matchingPrefix);
            form.setValue('phone', phone.substring(matchingPrefix.length).trim());
          } else {
            form.setValue('phone', phone);
          }
        } else {
          form.setValue('phone', phone);
        }
      }
    }
  }, [user, countries, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // Combine country code with phone number before saving
      const phoneWithCountryCode = data.phone ? `${countryCode}${data.phone.replace(/\s/g, '')}` : '';
      const response = await apiRequest(
        'PATCH',
        `/api/users/${authUser?.id}`,
        { ...data, phone: phoneWithCountryCode }
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
      try {
        a.remove(); // Modern, safer method
      } catch (e) {
        // Silently ignore
      }

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
                          <PhoneInput
                            value={field.value}
                            onChange={field.onChange}
                            countryCode={countryCode}
                            onCountryCodeChange={setCountryCode}
                            testId="input-phone"
                          />
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

        {/* Notification Preferences */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-6 h-6" />
              {t("profile.notifications.title", "Notification Preferences")}
            </CardTitle>
            <CardDescription>
              {t("profile.notifications.desc", "Control what types of notifications you receive")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notificationPrefsLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t("loading.notifications", "Loading notification preferences...")}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Emergency Alerts */}
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t("profile.notifications.emergency_alerts", "Emergency Alerts")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("profile.notifications.emergency_alerts_desc", "Critical notifications about your emergency requests")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs?.emergencyAlerts ?? true}
                    onCheckedChange={(checked) => handleNotificationToggle('emergencyAlerts', checked)}
                    disabled={updateNotificationPrefsMutation.isPending}
                    data-testid="switch-emergency-alerts"
                  />
                </div>

                {/* General Updates */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t("profile.notifications.general_updates", "General Updates")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("profile.notifications.general_updates_desc", "Platform announcements and service updates")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs?.generalUpdates ?? true}
                    onCheckedChange={(checked) => handleNotificationToggle('generalUpdates', checked)}
                    disabled={updateNotificationPrefsMutation.isPending}
                    data-testid="switch-general-updates"
                  />
                </div>

                {/* System Alerts */}
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t("profile.notifications.system_alerts", "System Alerts")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("profile.notifications.system_alerts_desc", "Maintenance notices and security alerts")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs?.systemAlerts ?? true}
                    onCheckedChange={(checked) => handleNotificationToggle('systemAlerts', checked)}
                    disabled={updateNotificationPrefsMutation.isPending}
                    data-testid="switch-system-alerts"
                  />
                </div>

                {/* Vet Tips */}
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t("profile.notifications.vet_tips", "Veterinary Tips")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("profile.notifications.vet_tips_desc", "Pet health tips and educational content")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs?.vetTips ?? true}
                    onCheckedChange={(checked) => handleNotificationToggle('vetTips', checked)}
                    disabled={updateNotificationPrefsMutation.isPending}
                    data-testid="switch-vet-tips"
                  />
                </div>

                {/* Promotions */}
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t("profile.notifications.promotions", "Promotions & Offers")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("profile.notifications.promotions_desc", "Special offers from partner clinics and hospitals")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs?.promotions ?? false}
                    onCheckedChange={(checked) => handleNotificationToggle('promotions', checked)}
                    disabled={updateNotificationPrefsMutation.isPending}
                    data-testid="switch-promotions"
                  />
                </div>

                {updateNotificationPrefsMutation.isPending && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {t("profile.notifications.saving", "Saving preferences...")}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two-Factor Authentication (Admin Only) */}
        {isAdmin && (
          <Card className="mt-6 border-2 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Lock className="w-6 h-6" />
                {t("profile.2fa.title", "Two-Factor Authentication")}
              </CardTitle>
              <CardDescription>
                {t("profile.2fa.desc", "Add an extra layer of security to your admin account")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {twoFactorStatusLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t("loading.2fa", "Loading 2FA status...")}
                </div>
              ) : twoFactorStatus?.enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-800 dark:text-green-300">
                        {t("profile.2fa.enabled_status", "2FA is enabled")}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {t("profile.2fa.backup_count", `${twoFactorStatus.backupCodesCount} backup codes remaining`)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const code = prompt(t("profile.2fa.enter_code", "Enter your 2FA code to regenerate backup codes:"));
                        if (code) regenerateBackupCodesMutation.mutate(code);
                      }}
                      disabled={regenerateBackupCodesMutation.isPending}
                      data-testid="button-regenerate-backup-codes"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t("profile.2fa.regenerate_codes", "New Backup Codes")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setShowDisable2FADialog(true)}
                      data-testid="button-disable-2fa"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {t("profile.2fa.disable_button", "Disable 2FA")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      {t("profile.2fa.not_enabled", "Two-factor authentication adds an extra layer of security by requiring a code from your authenticator app when logging in.")}
                    </p>
                  </div>
                  <Button
                    onClick={() => setup2FAMutation.mutate()}
                    disabled={setup2FAMutation.isPending}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    data-testid="button-enable-2fa"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {setup2FAMutation.isPending 
                      ? t("profile.2fa.setting_up", "Setting up...") 
                      : t("profile.2fa.enable_button", "Enable Two-Factor Authentication")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 2FA Setup Dialog */}
        <Dialog open={showTwoFactorSetup} onOpenChange={setShowTwoFactorSetup}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("profile.2fa.setup_title", "Set Up Two-Factor Authentication")}</DialogTitle>
              <DialogDescription>
                {t("profile.2fa.setup_desc", "Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {twoFactorSetupData && (
                <>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img 
                      src={twoFactorSetupData.qrCode} 
                      alt="2FA QR Code" 
                      className="w-48 h-48"
                      data-testid="img-2fa-qrcode"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      {t("profile.2fa.manual_entry", "Or enter this code manually:")}
                    </p>
                    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                      <code className="flex-1 text-center" data-testid="text-2fa-secret">{twoFactorSetupData.secret}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(twoFactorSetupData.secret)}
                        data-testid="button-copy-secret"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t("profile.2fa.enter_verification", "Enter the 6-digit code from your app:")}
                    </label>
                    <div className="flex justify-center">
                      <InputOTP
                        value={twoFactorCode}
                        onChange={setTwoFactorCode}
                        maxLength={6}
                        data-testid="input-2fa-code"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTwoFactorSetup(false);
                  setTwoFactorCode('');
                }}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                onClick={() => verify2FAMutation.mutate(twoFactorCode)}
                disabled={twoFactorCode.length !== 6 || verify2FAMutation.isPending}
                data-testid="button-verify-2fa"
              >
                {verify2FAMutation.isPending 
                  ? t("profile.2fa.verifying", "Verifying...") 
                  : t("profile.2fa.verify_button", "Verify & Enable")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Backup Codes Dialog */}
        <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("profile.2fa.backup_title", "Save Your Backup Codes")}</DialogTitle>
              <DialogDescription>
                {t("profile.2fa.backup_desc", "Store these codes securely. Each code can only be used once if you lose access to your authenticator app.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {backupCodes && (
                <div className="grid grid-cols-2 gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-white dark:bg-gray-700 rounded text-center" data-testid={`text-backup-code-${index}`}>
                      {code}
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={handleCopyBackupCodes}
                variant="outline"
                className="w-full"
                data-testid="button-copy-backup-codes"
              >
                {copiedBackupCodes ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t("profile.2fa.copied", "Copied!")}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    {t("profile.2fa.copy_codes", "Copy All Codes")}
                  </>
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowBackupCodes(false)} data-testid="button-close-backup-codes">
                {t("profile.2fa.saved_codes", "I've Saved My Codes")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Disable 2FA Dialog */}
        <Dialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("profile.2fa.disable_title", "Disable Two-Factor Authentication")}</DialogTitle>
              <DialogDescription>
                {t("profile.2fa.disable_desc", "Enter your current 2FA code to disable two-factor authentication. This will make your account less secure.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  value={disable2FACode}
                  onChange={setDisable2FACode}
                  maxLength={6}
                  data-testid="input-disable-2fa-code"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisable2FADialog(false);
                  setDisable2FACode('');
                }}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => disable2FAMutation.mutate(disable2FACode)}
                disabled={disable2FACode.length !== 6 || disable2FAMutation.isPending}
                data-testid="button-confirm-disable-2fa"
              >
                {disable2FAMutation.isPending 
                  ? t("profile.2fa.disabling", "Disabling...") 
                  : t("profile.2fa.confirm_disable", "Disable 2FA")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
