import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, MapPin, Phone, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Step-specific schemas
const step1Schema = z.object({
  symptom: z.string().min(10, "Please describe the symptom in detail (at least 10 characters)"),
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
  symptom: z.string().min(10, "Please describe the symptom in detail (at least 10 characters)"),
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
  const [step, setStep] = useState(1);
  const [gpsDetected, setGpsDetected] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsRetryCount, setGpsRetryCount] = useState(0);
  const { toast } = useToast();

  // Mock user ID - in real app, this would come from auth context
  const userId = "temp-user-id";

  // Fetch user's pets for quick selection
  const { data: pets = [], isLoading: petsLoading } = useQuery<any[]>({
    queryKey: ['/api/users', userId, 'pets'],
    enabled: step === 1, // Only fetch when on first step
  });

  const form = useForm<EmergencyFormData>({
    // Remove resolver to allow step-by-step validation
    defaultValues: {
      symptom: "",
      manualLocation: "",
      contactName: "",
      contactPhone: "",
      userId,
    },
  });

  // Auto-detect GPS location
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
  }, [step, gpsDetected, gpsRetryCount, form]);

  const createEmergencyMutation = useMutation({
    mutationFn: async (data: EmergencyFormData) => {
      const response = await fetch('/api/emergency-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create emergency request');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'emergency-requests'] });
      toast({
        title: "Emergency request submitted!",
        description: "Finding nearby clinics...",
      });
      // Navigate to clinic selection (will implement in next task)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Step {step} of 3</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">~{30 - (step - 1) * 10}s remaining</span>
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
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-2xl">Emergency Pet Care</CardTitle>
            </div>
            <CardDescription>
              {step === 1 && "Describe your pet's symptoms"}
              {step === 2 && "Confirm your location"}
              {step === 3 && "Your contact information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Symptom */}
                {step === 1 && (
                  <div className="space-y-4">
                    {petsLoading ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        Loading your pets...
                      </div>
                    ) : pets.length > 0 ? (
                      <FormField
                        control={form.control}
                        name="petId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg">Select Pet (Optional)</FormLabel>
                            <FormControl>
                              <select
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value || undefined)}
                                className="w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:border-gray-700"
                                data-testid="select-pet"
                              >
                                <option value="">Select a pet...</option>
                                {pets.map((pet: any) => (
                                  <option key={pet.id} value={pet.id}>
                                    {pet.name} ({pet.species})
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}

                    <FormField
                      control={form.control}
                      name="symptom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">What's happening?</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe the symptoms, behavior, or emergency situation..."
                              className="min-h-[120px] text-lg resize-none"
                              data-testid="input-symptom"
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                            <p className="font-medium text-blue-900 dark:text-blue-100">Location detected</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300" data-testid="text-gps-status">
                              {form.watch("locationLatitude")?.toFixed(4)}, {form.watch("locationLongitude")?.toFixed(4)}
                            </p>
                          </div>
                        ) : gpsError ? (
                          <div>
                            <p className="font-medium text-red-900 dark:text-red-100">GPS unavailable</p>
                            <p className="text-sm text-red-700 dark:text-red-300">Please enter location manually below</p>
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
                              Retry GPS
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">Detecting location...</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              We'll find the nearest 24-hour clinics
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
                          <FormLabel className="text-lg">Or enter location manually</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Central, Hong Kong Island"
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
                          <FormLabel className="text-lg font-semibold">Your Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
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
                          <FormLabel className="text-lg font-semibold">Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
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
                      Back
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
                      createEmergencyMutation.isPending ? "Submitting..." : "Find Clinics"
                    ) : (
                      <>
                        Next
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Emergency hotline */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Critical emergency?{" "}
            <a href="tel:999" className="text-red-600 font-semibold hover:underline">
              Call 999
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
