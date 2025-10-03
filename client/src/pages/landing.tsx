import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Clock, Phone, MapPin } from "lucide-react";

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Heart className="h-16 w-16 text-red-600" fill="currentColor" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Pet SOS
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Emergency veterinary care coordination platform for Hong Kong pet owners
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg"
            data-testid="button-login"
          >
            Log In to Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-3 lg:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Clock className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Fast Emergency Flow</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  3-step emergency request in under 30 seconds. Every second counts when your pet needs help.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <MapPin className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">24-Hour Clinics</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Find nearest 24-hour veterinary clinics across Hong Kong Island, Kowloon, and New Territories.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Phone className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">One-Tap Broadcast</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Alert multiple clinics instantly via WhatsApp with one tap. Get help faster.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <p className="text-sm text-amber-900 dark:text-amber-200 text-center">
              ⚠️ PetSOS provides emergency guidance only and is not medical advice. If in doubt, contact a vet immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
