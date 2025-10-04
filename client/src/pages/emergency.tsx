import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, MapPin, Phone, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";

// Symptom options organized by severity
const CRITICAL_SYMPTOMS = [
  { key: "unconscious", en: "Unconscious / Unresponsive", zh: "昏迷 / 失去意識", icon: "🔴" },
  { key: "breathing", en: "Not breathing / Severe difficulty breathing", zh: "呼吸停止 / 嚴重呼吸困難", icon: "🔴" },
  { key: "seizure", en: "Seizure / Convulsions", zh: "癲癇發作 / 抽搐", icon: "🔴" },
  { key: "choking", en: "Choking / Airway blocked", zh: "哽塞 / 氣道阻塞", icon: "🔴" },
];

const URGENT_SYMPTOMS = [
  { key: "bleeding", en: "Severe bleeding / Hemorrhage", zh: "嚴重出血 / 流血不止", icon: "🟠" },
  { key: "trauma", en: "Hit by vehicle / Major trauma", zh: "車禍撞擊 / 嚴重外傷", icon: "🟠" },
  { key: "poisoning", en: "Poisoning / Toxic ingestion", zh: "中毒 / 誤食毒物", icon: "🟠" },
  { key: "unable_stand", en: "Collapse / Cannot stand", zh: "倒下 / 無法站立", icon: "🟠" },
  { key: "swollen", en: "Bloated abdomen / Distended", zh: "腹部腫脹 / 腹脹", icon: "🟠" },
];

const CONCERNING_SYMPTOMS = [
  { key: "pain", en: "Severe pain / Distress", zh: "劇烈疼痛 / 痛苦不安", icon: "🟡" },
  { key: "vomiting", en: "Repeated vomiting", zh: "持續嘔吐", icon: "🟡" },
  { key: "diarrhea", en: "Severe diarrhea / Blood in stool", zh: "嚴重腹瀉 / 便血", icon: "🟡" },
  { key: "broken_bone", en: "Fracture / Cannot move limb", zh: "骨折 / 肢體無法移動", icon: "🟡" },
  { key: "eye_injury", en: "Eye injury / Sudden blindness", zh: "眼部受傷 / 突然失明", icon: "🟡" },
  { key: "not_eating", en: "Not eating/drinking for 24+ hours", zh: "24小時以上拒絕進食飲水", icon: "🟡" },
  { key: "other", en: "Other concerning symptoms", zh: "其他令人擔憂症狀", icon: "🟡" },
];

const ALL_SYMPTOMS = [...CRITICAL_SYMPTOMS, ...URGENT_SYMPTOMS, ...CONCERNING_SYMPTOMS];

// Step-specific schemas
const step1Schema = z.object({
  symptom: z.string().min(1, "Please select at least one symptom"),
  petId: z.string().optional(),
  userId: z.string(),
});

const step2Schema = z.object({
  locationLatitude: z.number().optional(),
  locationLongitude: z.number().optional(),
  manualLocation: z.string().optional(),
}).refine(
  (data) => 
    (data.locationLatitude !== undefined && data.locationLongitude !== undefined) || 
    (data.manualLocation && data.manualLocation.length > 0),
  {
    message: "Please provide a location (GPS or manual entry)",
    path: ["manualLocation"],
  }
);

const step3Schema = z.object({
  contactName: z.string().min(2, "Contact name is required"),
  contactPhone: z.string().min(8, "Please enter a valid phone number"),
});

// Complete schema for final submission
const emergencySchema = z.object({
  symptom: z.string().min(1, "Please select at least one symptom"),
  locationLatitude: z.number().optional(),
  locationLongitude: z.number().optional(),
  manualLocation: z.string().optional(),
  contactName: z.string().min(2, "Contact name is required"),
  contactPhone: z.string().min(8, "Please enter a valid phone number"),
  petId: z.string().optional(),
  userId: z.string(),
});

type EmergencyFormData = z.infer<typeof emergencySchema>;

export default function EmergencyPage() {
  const { t, language } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [otherSymptomText, setOtherSymptomText] = useState("");
  const [gpsDetected, setGpsDetected] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsRetryCount, setGpsRetryCount] = useState(0);
  const [contactManuallyEdited, setContactManuallyEdited] = useState(false);
  const [autoFilledUserData, setAutoFilledUserData] = useState<{ username: string; phone: string } | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const userId = user?.id;

  const form = useForm<EmergencyFormData>({
    // Remove resolver to allow step-by-step validation
    defaultValues: {
      symptom: "",
      manualLocation: "",
      contactName: "",
      contactPhone: "",
      userId: userId || "",
    },
  });

  // Update userId in form when authentication completes
  useEffect(() => {
    if (userId) {
      form.setValue("userId", userId);
    }
  }, [userId, form]);

  // Fetch user profile for auto-fill - always refetch to get latest data
  const { data: userProfile, isSuccess: userLoaded, isFetching: userFetching } = useQuery<any>({
    queryKey: [`/api/users/${userId}`],
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled: !!userId,
  });

  // Fetch user's pets for quick selection - only for authenticated users
  const { data: pets = [], isLoading: petsLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/pets`],
    enabled: step === 1 && !!userId, // Only fetch when on first step and user is authenticated
  });

  // Auto-detect GPS location - include gpsRetryCount to trigger retry
  useEffect(() => {
    if (step === 2 && !gpsDetected) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            form.setValue("locationLatitude", position.coords.latitude);
            form.setValue("locationLongitude", position.coords.longitude);
            setGpsDetected(true);
            setGpsError(null);
          },
          (error) => {
            setGpsError(error.message);
            setGpsDetected(false);
          }
        );
      } else {
        setGpsError("Geolocation is not supported by this browser");
      }
    }
  }, [step, gpsDetected, gpsRetryCount, form]); // Added gpsRetryCount to dependencies

  // Auto-fill contact information from user profile when on step 3
  useEffect(() => {
    // Only auto-fill if user hasn't manually edited the fields
    if (step === 3 && userLoaded && !userFetching && userProfile && !contactManuallyEdited) {
      // Auto-fill if this is the first time or if user data has changed
      const hasDataChanged = !autoFilledUserData || 
        autoFilledUserData.username !== userProfile.username || 
        autoFilledUserData.phone !== userProfile.phone;
      
      if (hasDataChanged) {
        const displayName = userProfile.firstName && userProfile.lastName 
          ? `${userProfile.firstName} ${userProfile.lastName}` 
          : userProfile.username || "";
        form.setValue("contactName", displayName);
        form.setValue("contactPhone", userProfile.phone || "");
        setAutoFilledUserData({ username: userProfile.username, phone: userProfile.phone });
      }
    }

    // Reset flags when navigating away from step 3
    if (step !== 3) {
      if (contactManuallyEdited) {
        setContactManuallyEdited(false);
      }
      if (autoFilledUserData) {
        setAutoFilledUserData(null);
      }
    }
  }, [step, form, userProfile, userLoaded, userFetching, contactManuallyEdited, autoFilledUserData]);

  const createEmergencyMutation = useMutation({
    mutationFn: async (data: EmergencyFormData) => {
      const response = await apiRequest('POST', '/api/emergency-requests', data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/emergency-requests`] });
      toast({
        title: t("emergency.submit.success", "Emergency request submitted!"),
        description: t("emergency.submit.finding", "Finding nearby clinics..."),
      });
      // Navigate to clinic results page
      setLocation(`/emergency-results/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: t("error", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle symptom selection
  const toggleSymptom = (symptomKey: string) => {
    setSelectedSymptoms(prev => {
      const newSymptoms = prev.includes(symptomKey)
        ? prev.filter(s => s !== symptomKey)
        : [...prev, symptomKey];
      
      // Build symptom string for form
      let symptomText = newSymptoms
        .filter(k => k !== 'other')
        .map(k => {
          const option = ALL_SYMPTOMS.find(opt => opt.key === k);
          return language === 'zh-HK' ? option?.zh : option?.en;
        })
        .join(', ');
      
      if (newSymptoms.includes('other') && otherSymptomText) {
        symptomText = symptomText ? `${symptomText}, ${otherSymptomText}` : otherSymptomText;
      }
      
      form.setValue('symptom', symptomText || '');
      return newSymptoms;
    });
  };

  const onSubmit = async (data: EmergencyFormData) => {
    // Validate current step before proceeding
    try {
      if (step === 1) {
        await step1Schema.parseAsync(data);
        setStep(2);
      } else if (step === 2) {
        await step2Schema.parseAsync(data);
        setStep(3);
      } else if (step === 3) {
        await step3Schema.parseAsync(data);
        // Final validation
        await emergencySchema.parseAsync(data);
        createEmergencyMutation.mutate(data);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set form errors
        error.errors.forEach((err) => {
          if (err.path[0]) {
            form.setError(err.path[0] as any, { message: err.message });
          }
        });
      }
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("emergency.step_indicator", "Step {step} of 3").replace("{step}", String(step))}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {step === 1 && t("emergency.time_step1", "~30s")}
              {step === 2 && t("emergency.time_step2", "~15s")}
              {step === 3 && t("emergency.time_step3", "~10s")}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <CardTitle className="text-2xl">{t("emergency.title", "Emergency Pet Care")}</CardTitle>
              </div>
              <LanguageSwitcher />
            </div>
            <CardDescription>
              {step === 1 && t("emergency.step1.title", "What's happening?")}
              {step === 2 && t("emergency.step2.title", "Where are you?")}
              {step === 3 && t("emergency.step3.title", "How can clinics reach you?")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Symptoms FIRST (most urgent), then Pet Selection (optional) */}
                {step === 1 && (
                  <div className="space-y-6">
                    {/* SYMPTOMS - Priority #1 */}
                    <FormField
                      control={form.control}
                      name="symptom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xl font-bold text-red-700 dark:text-red-400">
                            {t("symptoms.urgent", "What's happening to your pet right now?")}
                          </FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {t("symptoms.select_all", "Tap all symptoms that apply")}
                          </p>
                          <div className="space-y-4">
                            {/* CRITICAL SYMPTOMS - Large, prominent */}
                            <div>
                              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 uppercase">
                                🔴 {t("symptoms.critical", "Life-Threatening")}
                              </h3>
                              <div className="grid grid-cols-1 gap-2">
                                {CRITICAL_SYMPTOMS.map((option) => {
                                  const isSelected = selectedSymptoms.includes(option.key);
                                  const label = language === 'zh-HK' ? option.zh : option.en;
                                  
                                  return (
                                    <button
                                      key={option.key}
                                      type="button"
                                      onClick={() => toggleSymptom(option.key)}
                                      className={`
                                        px-5 py-4 text-left rounded-lg border-3 transition-all font-semibold text-base
                                        ${isSelected 
                                          ? 'border-red-600 bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100 shadow-lg' 
                                          : 'border-red-300 dark:border-red-800 hover:border-red-500 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-950/50'
                                        }
                                      `}
                                      data-testid={`symptom-${option.key}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`
                                          w-6 h-6 rounded-full border-2 flex items-center justify-center
                                          ${isSelected ? 'border-red-600 bg-red-600' : 'border-red-400 dark:border-red-700'}
                                        `}>
                                          {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                                        </div>
                                        <span>{label}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* URGENT SYMPTOMS */}
                            <div>
                              <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2 uppercase">
                                🟠 {t("symptoms.urgent_level", "Urgent Care Needed")}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {URGENT_SYMPTOMS.map((option) => {
                                  const isSelected = selectedSymptoms.includes(option.key);
                                  const label = language === 'zh-HK' ? option.zh : option.en;
                                  
                                  return (
                                    <button
                                      key={option.key}
                                      type="button"
                                      onClick={() => toggleSymptom(option.key)}
                                      className={`
                                        px-4 py-3 text-left rounded-lg border-2 transition-all
                                        ${isSelected 
                                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-900 dark:text-orange-100' 
                                          : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                                        }
                                      `}
                                      data-testid={`symptom-${option.key}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`
                                          w-5 h-5 rounded-full border-2 flex items-center justify-center
                                          ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300 dark:border-gray-600'}
                                        `}>
                                          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="text-sm font-medium">{label}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* CONCERNING SYMPTOMS */}
                            <div>
                              <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2 uppercase">
                                🟡 {t("symptoms.concerning", "Concerning Symptoms")}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {CONCERNING_SYMPTOMS.map((option) => {
                                  const isSelected = selectedSymptoms.includes(option.key);
                                  const label = language === 'zh-HK' ? option.zh : option.en;
                                  
                                  return (
                                    <button
                                      key={option.key}
                                      type="button"
                                      onClick={() => toggleSymptom(option.key)}
                                      className={`
                                        px-4 py-3 text-left rounded-lg border-2 transition-all
                                        ${isSelected 
                                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100' 
                                          : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700'
                                        }
                                      `}
                                      data-testid={`symptom-${option.key}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`
                                          w-5 h-5 rounded-full border-2 flex items-center justify-center
                                          ${isSelected ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300 dark:border-gray-600'}
                                        `}>
                                          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="text-sm font-medium">{label}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Additional text input if "Other" is selected */}
                            {selectedSymptoms.includes('other') && (
                              <div>
                                <Textarea
                                  value={otherSymptomText}
                                  onChange={(e) => {
                                    setOtherSymptomText(e.target.value);
                                    const otherSymptoms = selectedSymptoms
                                      .filter(k => k !== 'other')
                                      .map(k => {
                                        const opt = ALL_SYMPTOMS.find(o => o.key === k);
                                        return language === 'zh-HK' ? opt?.zh : opt?.en;
                                      })
                                      .join(', ');
                                    const fullText = otherSymptoms ? `${otherSymptoms}, ${e.target.value}` : e.target.value;
                                    form.setValue('symptom', fullText);
                                  }}
                                  placeholder={t("symptoms.describe", "Describe the symptoms...")}
                                  className="min-h-[80px] text-base"
                                  data-testid="input-other-symptom"
                                />
                              </div>
                            )}
                            
                            <input type="hidden" {...field} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* PET SELECTION - Optional, shown AFTER symptoms for logged-in users */}
                    {userId && pets.length > 0 && (
                      <FormField
                        control={form.control}
                        name="petId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-gray-700 dark:text-gray-300">
                              {t("emergency.select_pet", "Which pet is this for?")} <span className="text-sm text-gray-500">({t("optional", "Optional")})</span>
                            </FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {pets.map((pet: any) => {
                                  const isSelected = field.value === pet.id;
                                  return (
                                    <button
                                      key={pet.id}
                                      type="button"
                                      onClick={() => field.onChange(isSelected ? undefined : pet.id)}
                                      className={`
                                        p-3 rounded-lg border-2 transition-all text-left text-sm
                                        ${isSelected 
                                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                        }
                                      `}
                                      data-testid={`pet-card-${pet.id}`}
                                    >
                                      <div className="font-semibold truncate">{pet.name}</div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        {pet.breed || pet.species}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Step 2: Location */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        {gpsDetected ? (
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                              {t("emergency.step2.detected", "Location detected")}
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300" data-testid="text-gps-status">
                              {form.watch("locationLatitude")?.toFixed(4)}, {form.watch("locationLongitude")?.toFixed(4)}
                            </p>
                          </div>
                        ) : gpsError ? (
                          <div>
                            <p className="font-medium text-red-900 dark:text-red-100">
                              {t("emergency.gps.unavailable", "GPS unavailable")}
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {t("emergency.gps.manual", "Please enter location manually below")}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setGpsError(null);
                                setGpsDetected(false);
                                setGpsRetryCount(prev => prev + 1);
                              }}
                              className="mt-2"
                              data-testid="button-retry-gps"
                            >
                              {t("emergency.step2.retry", "Retry GPS")}
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                              {t("emergency.step2.detecting", "Detecting your location...")}
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {t("emergency.step2.nearest", "We'll find the nearest 24-hour clinics")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="manualLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg">
                            {t("emergency.step2.manual_label", "Or enter your location manually")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder={t("emergency.step2.placeholder", "e.g., Central, Hong Kong Island")}
                              className="text-lg"
                              data-testid="input-manual-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Contact */}
                {step === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">{t("emergency.step3.name", "Your Name")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setContactManuallyEdited(true);
                              }}
                              placeholder="Full name"
                              className="text-lg"
                              data-testid="input-contact-name"
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">{t("emergency.step3.phone", "Phone Number")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setContactManuallyEdited(true);
                              }}
                              type="tel"
                              placeholder="+852 1234 5678"
                              className="text-lg"
                              data-testid="input-contact-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <Phone className="h-5 w-5 text-green-600 mt-0.5" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Clinics will contact you at this number to confirm availability
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={goBack}
                      className="flex-1"
                      data-testid="button-back"
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      {t("button.previous", "Back")}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold py-6"
                    disabled={createEmergencyMutation.isPending}
                    data-testid="button-next"
                  >
                    {step === 3 ? (
                      createEmergencyMutation.isPending ? "Submitting..." : t("button.submit", "Find Clinics")
                    ) : (
                      <>
                        {t("button.next", "Next")}
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Medical disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("app.disclaimer", "⚠️ PetSOS provides emergency guidance only and is not medical advice. If in doubt, contact a vet immediately.")}
          </p>
        </div>
      </div>
    </div>
  );
}
