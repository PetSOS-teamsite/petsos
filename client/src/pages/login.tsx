import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FcGoogle } from "react-icons/fc";
import { Separator } from "@/components/ui/separator";
import { PhoneInput } from "@/components/PhoneInput";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Email-specific schemas
const emailLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
});

const emailSignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
});

// Phone-specific schemas
const phoneLoginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  countryCode: z.string().default("+852"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().optional(),
});

const phoneSignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  countryCode: z.string().default("+852"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().optional(),
});

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const emailLoginForm = useForm({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      phone: "",
      countryCode: "+852",
    },
  });

  const phoneLoginForm = useForm({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: "",
      countryCode: "+852",
      password: "",
      email: "",
    },
  });

  const emailSignupForm = useForm({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      countryCode: "+852",
    },
    mode: "onSubmit",
  });

  const phoneSignupForm = useForm({
    resolver: zodResolver(phoneSignupSchema),
    defaultValues: {
      name: "",
      phone: "",
      countryCode: "+852",
      password: "",
      email: "",
    },
    mode: "onSubmit",
  });

  // Reset forms when toggling between login and signup
  useEffect(() => {
    if (isSignup) {
      emailSignupForm.reset();
      phoneSignupForm.reset();
    } else {
      emailLoginForm.reset();
      phoneLoginForm.reset();
    }
  }, [isSignup, emailSignupForm, phoneSignupForm, emailLoginForm, phoneLoginForm]);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google?returnTo=/profile";
  };

  const onLogin = async (data: any) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      
      // Wait for the user query to refetch before redirecting
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      
      setLocation("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    }
  };

  const onSignup = async (data: any) => {
    try {
      // Clear unused fields based on auth method
      const cleanedData = authMethod === 'email' 
        ? { ...data, phone: undefined, countryCode: undefined }
        : { ...data, email: undefined };
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Signup failed");
      }
      
      // Wait for the user query to refetch before redirecting
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      
      setLocation("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Signup failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-red-600">
            PetSOS
          </CardTitle>
          <CardDescription>
            {isSignup ? "Create your account" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full"
            data-testid="button-google-login"
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Email/Phone Tabs */}
          <Tabs defaultValue="email" className="w-full" onValueChange={(value) => setAuthMethod(value as 'email' | 'phone')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" data-testid="tab-email">Email</TabsTrigger>
              <TabsTrigger value="phone" data-testid="tab-phone">Phone</TabsTrigger>
            </TabsList>
            
            {authMethod === 'email' && (
              <div className="mt-4" role="tabpanel" aria-labelledby="tab-email" id="panel-email">
                {isSignup ? (
                  <Form {...emailSignupForm}>
                    <form onSubmit={emailSignupForm.handleSubmit(onSignup)} className="space-y-4">
                      <FormField
                        control={emailSignupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                data-testid="input-name" 
                                placeholder="Enter your name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <FormField
                      control={emailSignupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailSignupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" data-testid="button-signup">
                      Create Account
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...emailLoginForm}>
                  <form onSubmit={emailLoginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={emailLoginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailLoginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" data-testid="button-login">
                      Sign In
                    </Button>
                    </form>
                  </Form>
                )}
              </div>
            )}
            
            {authMethod === 'phone' && (
              <div className="mt-4" role="tabpanel" aria-labelledby="tab-phone" id="panel-phone">
                {isSignup ? (
                  <Form {...phoneSignupForm}>
                    <form onSubmit={phoneSignupForm.handleSubmit(onSignup)} className="space-y-4">
                      <FormField
                        control={phoneSignupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                data-testid="input-name-phone" 
                                placeholder="Enter your name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <FormField
                      control={phoneSignupForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value || ""}
                              onChange={field.onChange}
                              countryCode={phoneSignupForm.watch("countryCode") || "+852"}
                              onCountryCodeChange={(code) => phoneSignupForm.setValue("countryCode", code)}
                              testId="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={phoneSignupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-password-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" data-testid="button-signup-phone">
                      Create Account
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...phoneLoginForm}>
                  <form onSubmit={phoneLoginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={phoneLoginForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value || ""}
                              onChange={field.onChange}
                              countryCode={phoneLoginForm.watch("countryCode") || "+852"}
                              onCountryCodeChange={(code) => phoneLoginForm.setValue("countryCode", code)}
                              testId="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={phoneLoginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-password-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" data-testid="button-login-phone">
                      Sign In
                    </Button>
                  </form>
                </Form>
              )}
              </div>
            )}
          </Tabs>

          {/* Toggle between login and signup */}
          <div className="text-center text-sm">
            {isSignup ? (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => setIsSignup(false)}
                  className="text-red-600 hover:underline font-medium"
                  data-testid="link-signin"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{" "}
                <button
                  onClick={() => setIsSignup(true)}
                  className="text-red-600 hover:underline font-medium"
                  data-testid="link-signup"
                >
                  Create account
                </button>
              </p>
            )}
          </div>

          {/* Back to home */}
          <div className="text-center">
            <a href="/" className="text-sm text-muted-foreground hover:underline">
              ← Back to home
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
