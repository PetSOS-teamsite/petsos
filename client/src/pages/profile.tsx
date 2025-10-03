import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { User, Phone, Mail, Globe, MapPin, Save, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { User as UserType, Region } from "@shared/schema";

const createProfileSchema = (t: (key: string, fallback: string) => string) => z.object({
  username: z.string().min(3, t("profile.validation.username", "Username must be at least 3 characters")),
  email: z.string().email(t("profile.validation.email", "Please enter a valid email")),
  phone: z.string().min(8, t("profile.validation.phone", "Please enter a valid phone number")),
  languagePreference: z.enum(['en', 'zh-HK']),
  regionPreference: z.string().optional(),
});

type ProfileSchemaType = ReturnType<typeof createProfileSchema>;
type ProfileFormData = z.infer<ProfileSchemaType>;

export default function ProfilePage() {
  const userId = "temp-user-id";
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const { setLanguage } = useLanguage();
  
  const profileSchema = createProfileSchema(t);

  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ['/api/users', userId],
  });

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ['/api/regions'],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: user ? {
      username: user.username,
      email: user.email,
      phone: user.phone,
      languagePreference: user.languagePreference as 'en' | 'zh-HK',
      regionPreference: user.regionPreference || undefined,
    } : undefined,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest(
        'PATCH',
        `/api/users/${userId}`,
        data
      );
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
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

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">{t("loading.profile", "Loading profile...")}</div>
      </div>
    );
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
