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
import { BreedCombobox } from "@/components/BreedCombobox";
import { analytics } from "@/lib/analytics";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { PhoneInput } from "@/components/PhoneInput";

// Symptom options - simplified without categorization
const SYMPTOMS = [
  { key: "unconscious", en: "Unconscious / Unresponsive", zh: "昏迷 / 失去意識" },
  { key: "breathing", en: "Not breathing / Severe difficulty breathing", zh: "呼吸停止 / 嚴重呼吸困難" },
  { key: "seizure", en: "Seizure / Convulsions", zh: "癲癇發作 / 抽搐" },
  { key: "choking", en: "Choking / Airway blocked", zh: "哽塞 / 氣道阻塞" },
  { key: "bleeding", en: "Severe bleeding / Hemorrhage", zh: "嚴重出血 / 流血不止" },
  { key: "trauma", en: "Hit by vehicle / Major trauma", zh: "車禍撞擊 / 嚴重外傷" },
  { key: "poisoning", en: "Poisoning / Toxic ingestion", zh: "中毒 / 誤食毒物" },
  { key: "unable_stand", en: "Collapse / Cannot stand", zh: "倒下 / 無法站立" },
  { key: "swollen", en: "Bloated abdomen / Distended", zh: "腹部腫脹 / 腹脹" },
  { key: "pain", en: "Severe pain / Distress", zh: "劇烈疼痛 / 痛苦不安" },
  { key: "vomiting", en: "Repeated vomiting", zh: "持續嘔吐" },
  { key: "diarrhea", en: "Severe diarrhea / Blood in stool", zh: "嚴重腹瀉 / 便血" },
  { key: "broken_bone", en: "Fracture / Cannot move limb", zh: "骨折 / 肢體無法移動" },
  { key: "eye_injury", en: "Eye injury / Sudden blindness", zh: "眼部受傷 / 突然失明" },
  { key: "not_eating", en: "Not eating/drinking for 24+ hours", zh: "24小時以上拒絕進食飲水" },
  { key: "other", en: "Other concerning symptoms", zh: "其他令人擔憂症狀" },
];

export default function EmergencyPage() {
  const { t, language } = useTranslation();
  
  // Define schemas inside component to access t()
  const step1Schema = z.object({
    symptom: z.string().min(1, t("validation.symptom_required", "Please select at least one symptom")),
    petId: z.string().optional(),
    petSpecies: z.string().optional(),
    petBreed: z.string().optional(),
    petAge: z.number().optional(),
    userId: z.string().optional(),
  }).refine(
    (data) => {
      if (!data.petId) {
        return !!data.petSpecies;
      }
      return true;
    },
    {
      message: t("validation.pet_required", "Please select a pet or provide pet details"),
      path: ["petSpecies"],
    }
  );

  const step2Schema = z.object({
    locationLatitude: z.number().optional(),
    locationLongitude: z.number().optional(),
    manualLocation: z.string().optional(),
  }).refine(
    (data) => 
      (data.locationLatitude !== undefined && data.locationLongitude !== undefined) || 
      (data.manualLocation && data.manualLocation.length > 0),
    {
      message: t("validation.location_required", "Please provide a location (GPS or manual entry)"),
      path: ["manualLocation"],
    }
  );

  const step3Schema = z.object({
    contactName: z.string().min(2, t("validation.name_required", "Contact name is required")),
    contactPhone: z.string().min(6, t("validation.phone_required", "Please enter a valid phone number")),
  });

  const emergencySchema = z.object({
    symptom: z.string().min(1, t("validation.symptom_required", "Please select at least one symptom")),
    locationLatitude: z.number().optional(),
    locationLongitude: z.number().optional(),
    manualLocation: z.string().optional(),
    contactName: z.string().min(2, t("validation.name_required", "Contact name is required")),
    contactPhone: z.string().min(6, t("validation.phone_required", "Please enter a valid phone number")),
    petId: z.string().optional(),
    petSpecies: z.string().optional(),
    petBreed: z.string().optional(),
    petAge: z.number().optional(),
    userId: z.string().optional(),
  });

  type EmergencyFormData = z.infer<typeof emergencySchema>;
  const { user, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [otherSymptomText, setOtherSymptomText] = useState("");
  const [gpsDetected, setGpsDetected] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsRetryCount, setGpsRetryCount] = useState(0);
  const [contactManuallyEdited, setContactManuallyEdited] = useState(false);
  const [autoFilledUserData, setAutoFilledUserData] = useState<{ username: string; phone: string } | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [aiAnalyzedSymptoms, setAiAnalyzedSymptoms] = useState<string>('');
  const [useVoiceInput, setUseVoiceInput] = useState(false);
  const [countryCode, setCountryCode] = useState("+852"); // Default to Hong Kong
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const userId = user?.id;

  const form = useForm<EmergencyFormData>({
    // Remove resolver to allow step-by-step validation
    shouldUnregister: false, // Keep field values even when fields are unmounted (multi-step form)
    defaultValues: {
      symptom: "",
      manualLocation: "",
      contactName: "",
      contactPhone: "",
      userId: userId, // Will be undefined for anonymous users
      petSpecies: undefined,
      petBreed: undefined,
      petAge: undefined,
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
            setGpsError(t("emergency.gps.error", "Unable to detect location"));
            setGpsDetected(false);
          }
        );
      } else {
        setGpsError(t("emergency.gps.not_supported", "Geolocation is not supported by this browser"));
      }
    }
  }, [step, gpsDetected, gpsRetryCount, form, t]); // Added gpsRetryCount and t to dependencies

  // Fetch countries for parsing phone numbers
  const { data: countries = [] } = useQuery<any[]>({
    queryKey: ["/api/countries"],
    enabled: step === 3, // Only fetch when needed
  });

  // Auto-fill contact information from user profile when on step 3
  useEffect(() => {
    // Only auto-fill if user hasn't manually edited the fields
    if (step === 3 && userLoaded && !userFetching && userProfile && !contactManuallyEdited && countries.length > 0) {
      // Auto-fill if this is the first time or if user data has changed
      const hasDataChanged = !autoFilledUserData || 
        autoFilledUserData.username !== userProfile.username || 
        autoFilledUserData.phone !== userProfile.phone;
      
      if (hasDataChanged) {
        const displayName = userProfile.name || userProfile.username || "";
        form.setValue("contactName", displayName);
        
        // Parse phone number to extract country code
        if (userProfile.phone) {
          const phone = userProfile.phone.trim();
          // Check if phone starts with + (country code format)
          if (phone.startsWith('+')) {
            // Get all valid phone prefixes and sort by length (longest first)
            const validPrefixes = countries
              .map(c => c.phonePrefix)
              .filter(Boolean)
              .sort((a, b) => b.length - a.length); // Longest first to match +852 before +85
            
            // Find the first matching prefix
            const matchingPrefix = validPrefixes.find(prefix => phone.startsWith(prefix));
            
            if (matchingPrefix) {
              setCountryCode(matchingPrefix); // e.g., "+852"
              form.setValue("contactPhone", phone.substring(matchingPrefix.length).trim()); // e.g., "12345678"
            } else {
              // No matching prefix found, use the whole number
              form.setValue("contactPhone", phone);
            }
          } else {
            form.setValue("contactPhone", phone);
          }
        }
        
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
  }, [step, form, userProfile, userLoaded, userFetching, contactManuallyEdited, autoFilledUserData, countries]);

  const createEmergencyMutation = useMutation({
    mutationFn: async (data: EmergencyFormData) => {
      const response = await apiRequest('POST', '/api/emergency-requests', data);
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/emergency-requests`] });
      
      // Track emergency request in analytics
      // Note: Clinic count and 24-hour status are not known at submission time
      analytics.trackEmergencyRequest({
        petType: variables.petSpecies || 'unknown',
        region: data.regionId, // May be undefined if location couldn't be determined
        // is24Hour and clinicsCount omitted - not available until search results
      });
      
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
          const option = SYMPTOMS.find(opt => opt.key === k);
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
        // Get ALL form values (data param only has step 3 fields)
        const allFormValues = form.getValues();
        // Combine country code with phone number
        const fullPhone = allFormValues.contactPhone 
          ? `${countryCode}${allFormValues.contactPhone}` 
          : allFormValues.contactPhone;
        // Add voice recording data if available
        const submitData = {
          ...allFormValues,
          contactPhone: fullPhone, // Use the combined phone number
          voiceTranscript: voiceTranscript || undefined,
          aiAnalyzedSymptoms: aiAnalyzedSymptoms || undefined,
          isVoiceRecording: useVoiceInput,
        };
        // Final validation with all values
        await emergencySchema.parseAsync(submitData);
        createEmergencyMutation.mutate(submitData);
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
                {/* Step 1: Pet Selection FIRST (if user has pets), then Voice/Symptoms */}
                {step === 1 && (
                  <div className="space-y-6">
                    {/* PET SELECTION FIRST - For users with registered pets (faster flow) */}
                    {userId && pets.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <FormField
                          control={form.control}
                          name="petId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                {t("emergency.select_pet", "Which pet is this for?")}
                              </FormLabel>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                {t("emergency.select_pet_desc", "Select your pet for faster emergency help")}
                              </p>
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
                                            ? 'border-blue-600 bg-blue-100 dark:bg-blue-900 shadow-md' 
                                            : 'border-blue-200 dark:border-blue-700 hover:border-blue-400 bg-white dark:bg-gray-800'
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
                      </div>
                    )}

                    {/* VOICE RECORDER - For panicked users who can't type */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          🎤 {t('emergency.voice_option', 'Too panicked to type? Use voice instead')}
                        </h3>
                      </div>
                      <VoiceRecorder
                        language={language}
                        onTranscriptComplete={(transcript, analyzedSymptoms) => {
                          setVoiceTranscript(transcript);
                          setAiAnalyzedSymptoms(analyzedSymptoms);
                          setUseVoiceInput(true);
                          // Auto-fill the symptom field with analyzed symptoms
                          form.setValue('symptom', analyzedSymptoms);
                          toast({
                            title: t('emergency.voice_recorded', 'Voice recorded successfully'),
                            description: t('emergency.voice_analyzed', 'Your symptoms have been analyzed and will be sent to clinics'),
                          });
                        }}
                      />
                    </div>

                    {/* Divider */}
                    {voiceTranscript && (
                      <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {t('emergency.or_select_manually', 'Or select symptoms manually')}
                        </span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                    )}

                    {/* SYMPTOMS - Simplified without categorization */}
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
                          <div className="space-y-3">
                            {/* All symptoms in a unified grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {SYMPTOMS.map((option) => {
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
                                        ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
                                      }
                                    `}
                                    data-testid={`symptom-${option.key}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`
                                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                                        ${isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300 dark:border-gray-600'}
                                      `}>
                                        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                      </div>
                                      <span className="text-sm font-medium">{label}</span>
                                    </div>
                                  </button>
                                );
                              })}
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
                                        const opt = SYMPTOMS.find(o => o.key === k);
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

                    {/* PET DETAILS - For users without pets or anonymous users (only if no pet selected) */}
                    {(!userId || pets.length === 0 || !form.watch("petId")) && (
                      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {t("emergency.pet_details", "Pet Information")}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("emergency.pet_details_desc", "Tell us about your pet so clinics can prepare")}
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="petSpecies"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("pets.species", "Species")} <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => field.onChange("dog")}
                                    className={`
                                      p-4 rounded-lg border-2 transition-all font-medium text-base
                                      ${field.value === "dog"
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                      }
                                    `}
                                    data-testid="button-species-dog"
                                  >
                                    🐕 {t("pets.dog", "Dog")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => field.onChange("cat")}
                                    className={`
                                      p-4 rounded-lg border-2 transition-all font-medium text-base
                                      ${field.value === "cat"
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                      }
                                    `}
                                    data-testid="button-species-cat"
                                  >
                                    🐱 {t("pets.cat", "Cat")}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="petBreed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("pets.breed", "Breed")}</FormLabel>
                              <FormControl>
                                <BreedCombobox
                                  species={form.watch("petSpecies") || ""}
                                  value={field.value ?? ""}
                                  onChange={field.onChange}
                                  placeholder={t("pets.breed_placeholder", "Select or type breed...")}
                                  testId="combobox-pet-breed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="petAge"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("pets.age", "Age (years)")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  placeholder={t("pets.age_placeholder", "e.g., 3")}
                                  data-testid="input-pet-age"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
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
                              placeholder={t("emergency.step3.name_placeholder", "Full name")}
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
                            <PhoneInput
                              value={field.value}
                              onChange={(value) => {
                                field.onChange(value);
                                setContactManuallyEdited(true);
                              }}
                              countryCode={countryCode}
                              onCountryCodeChange={setCountryCode}
                              placeholder={t("emergency.step3.phone_placeholder", "1234 5678")}
                              testId="input-contact-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <Phone className="h-5 w-5 text-green-600 mt-0.5" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {t("emergency.step3.clinic_contact", "Clinics will contact you at this number to confirm availability")}
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
                      createEmergencyMutation.isPending ? t("button.submitting", "Submitting...") : t("button.submit", "Find Clinics")
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
