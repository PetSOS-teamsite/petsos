import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Check, Building2, Phone, Mail, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

const translations = {
  en: {
    title: "Hospital Update Portal",
    subtitle: "Verify and update your hospital information",
    accessCodeLabel: "Access Code",
    accessCodePlaceholder: "Enter your 8-character access code",
    accessCodeHelp: "Enter the access code provided to your hospital",
    verifyButton: "Verify Access Code",
    verifying: "Verifying...",
    invalidCode: "Invalid access code. Please check and try again.",
    hospitalInfo: "Hospital Information",
    currentInfo: "Current Information",
    editInfo: "Edit Information",
    nameEn: "Name (English)",
    nameZh: "Name (Chinese)",
    phone: "Phone Number",
    whatsapp: "WhatsApp",
    email: "Email",
    is24Hour: "24-Hour Service",
    is24HourDesc: "Hospital provides 24-hour emergency services",
    confirmedBy: "Your Name",
    confirmedByPlaceholder: "Enter your name",
    confirmedByHelp: "Name of the person confirming/updating this information",
    lastConfirmed: "Last Confirmed",
    neverConfirmed: "Never confirmed",
    confirmOnly: "Information is Correct",
    updateInfo: "Update Information",
    saving: "Saving...",
    successTitle: "Update Successful!",
    successMessage: "Your hospital information has been updated and confirmed.",
    confirmSuccessTitle: "Confirmation Successful!",
    confirmSuccessMessage: "Your hospital information has been confirmed as correct.",
    backToHome: "Back to Home",
    startOver: "Submit Another Update",
    updateError: "Failed to update information. Please try again.",
  },
  zh: {
    title: "醫院資料更新",
    subtitle: "驗證並更新您的醫院資料",
    accessCodeLabel: "訪問碼",
    accessCodePlaceholder: "輸入您的8位訪問碼",
    accessCodeHelp: "輸入發送給您醫院的訪問碼",
    verifyButton: "驗證訪問碼",
    verifying: "驗證中...",
    invalidCode: "訪問碼無效，請檢查後重試。",
    hospitalInfo: "醫院資料",
    currentInfo: "現有資料",
    editInfo: "編輯資料",
    nameEn: "名稱（英文）",
    nameZh: "名稱（中文）",
    phone: "電話號碼",
    whatsapp: "WhatsApp",
    email: "電郵",
    is24Hour: "24小時服務",
    is24HourDesc: "醫院提供24小時急症服務",
    confirmedBy: "您的姓名",
    confirmedByPlaceholder: "輸入您的姓名",
    confirmedByHelp: "確認/更新此資料的人員姓名",
    lastConfirmed: "上次確認",
    neverConfirmed: "從未確認",
    confirmOnly: "資料正確無誤",
    updateInfo: "更新資料",
    saving: "儲存中...",
    successTitle: "更新成功！",
    successMessage: "您的醫院資料已更新並確認。",
    confirmSuccessTitle: "確認成功！",
    confirmSuccessMessage: "您的醫院資料已確認為正確。",
    backToHome: "返回首頁",
    startOver: "提交另一項更新",
    updateError: "無法更新資料，請重試。",
  }
};

type Language = "en" | "zh";

const accessCodeSchema = z.object({
  accessCode: z.string().length(8, "Access code must be 8 characters"),
});

const updateFormSchema = z.object({
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  open247: z.boolean(),
  confirmedByName: z.string().min(1, "Name is required"),
});

type AccessCodeData = z.infer<typeof accessCodeSchema>;
type UpdateFormData = z.infer<typeof updateFormSchema>;

interface HospitalInfo {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  addressEn: string;
  addressZh: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  open247: boolean;
  lastConfirmedAt: string | null;
  confirmedByName: string | null;
}

export default function HospitalUpdatePage() {
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>("en");
  const [step, setStep] = useState<"verify" | "edit" | "success">("verify");
  const [hospital, setHospital] = useState<HospitalInfo | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [wasConfirmOnly, setWasConfirmOnly] = useState(false);

  const t = translations[language];

  const verifyForm = useForm<AccessCodeData>({
    resolver: zodResolver(accessCodeSchema),
    defaultValues: { accessCode: "" },
  });

  const updateForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      phone: "",
      whatsapp: "",
      email: "",
      open247: true,
      confirmedByName: "",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: AccessCodeData) => {
      const response = await apiRequest("POST", "/api/hospitals/verify-code", data);
      return response.json();
    },
    onSuccess: (data: HospitalInfo) => {
      setHospital(data);
      setAccessCode(verifyForm.getValues("accessCode").toUpperCase());
      updateForm.reset({
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        email: data.email || "",
        open247: data.open247,
        confirmedByName: "",
      });
      setStep("edit");
    },
    onError: () => {
      toast({ title: t.invalidCode, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateFormData) => {
      const response = await apiRequest("POST", "/api/hospitals/update-by-code", {
        accessCode,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      setWasConfirmOnly(false);
      setStep("success");
    },
    onError: () => {
      toast({ title: t.updateError, variant: "destructive" });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (confirmedByName: string) => {
      const response = await apiRequest("POST", "/api/hospitals/confirm-info", {
        accessCode,
        confirmedByName,
      });
      return response.json();
    },
    onSuccess: () => {
      setWasConfirmOnly(true);
      setStep("success");
    },
    onError: () => {
      toast({ title: t.updateError, variant: "destructive" });
    },
  });

  const handleConfirmOnly = () => {
    const confirmedByName = updateForm.getValues("confirmedByName");
    if (!confirmedByName) {
      updateForm.setError("confirmedByName", { message: "Name is required" });
      return;
    }
    confirmMutation.mutate(confirmedByName);
  };

  const handleStartOver = () => {
    setStep("verify");
    setHospital(null);
    setAccessCode("");
    verifyForm.reset();
    updateForm.reset();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t.neverConfirmed;
    return new Date(dateStr).toLocaleDateString(language === "zh" ? "zh-HK" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
                data-testid="button-language-en"
              >
                EN
              </Button>
              <Button
                variant={language === "zh" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("zh")}
                data-testid="button-language-zh"
              >
                中文
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        {step === "verify" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.accessCodeHelp}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...verifyForm}>
                <form onSubmit={verifyForm.handleSubmit((data) => verifyMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={verifyForm.control}
                    name="accessCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.accessCodeLabel}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t.accessCodePlaceholder}
                            maxLength={8}
                            className="text-center text-2xl tracking-widest uppercase"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            data-testid="input-access-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={verifyMutation.isPending}
                    data-testid="button-verify"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.verifying}
                      </>
                    ) : (
                      t.verifyButton
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === "edit" && hospital && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.currentInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">{t.nameEn}</p>
                  <p className="font-medium" data-testid="text-hospital-name-en">{hospital.nameEn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.nameZh}</p>
                  <p className="font-medium" data-testid="text-hospital-name-zh">{hospital.nameZh}</p>
                </div>
                {hospital.lastConfirmedAt && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-500">{t.lastConfirmed}</p>
                    <p className="text-sm" data-testid="text-last-confirmed">
                      {formatDate(hospital.lastConfirmedAt)}
                      {hospital.confirmedByName && ` • ${hospital.confirmedByName}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.editInfo}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...updateForm}>
                  <form onSubmit={updateForm.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={updateForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {t.phone}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.whatsapp}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-whatsapp" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {t.email}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="open247"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {t.is24Hour}
                            </FormLabel>
                            <FormDescription>{t.is24HourDesc}</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-24hour"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="confirmedByName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {t.confirmedBy} *
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t.confirmedByPlaceholder} data-testid="input-confirmed-by" />
                          </FormControl>
                          <FormDescription>{t.confirmedByHelp}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleConfirmOnly}
                        disabled={confirmMutation.isPending || updateMutation.isPending}
                        data-testid="button-confirm-only"
                      >
                        {confirmMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.saving}
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            {t.confirmOnly}
                          </>
                        )}
                      </Button>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={updateMutation.isPending || confirmMutation.isPending}
                        data-testid="button-update"
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.saving}
                          </>
                        ) : (
                          t.updateInfo
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "success" && (
          <Card>
            <CardContent className="py-12 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-success-title">
                  {wasConfirmOnly ? t.confirmSuccessTitle : t.successTitle}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2" data-testid="text-success-message">
                  {wasConfirmOnly ? t.confirmSuccessMessage : t.successMessage}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/">
                  <Button className="w-full" data-testid="button-back-home">
                    {t.backToHome}
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleStartOver} data-testid="button-start-over">
                  {t.startOver}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
