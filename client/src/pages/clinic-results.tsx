import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, MapPin, Clock, Navigation, Send, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Clinic {
  id: string;
  name: string;
  nameZh: string | null;
  address: string;
  addressZh: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  regionId: string;
  is24Hour: boolean;
  latitude: string | null;
  longitude: string | null;
  status: string;
  services: string[] | null;
  distance?: number;
}

interface Region {
  id: string;
  code: string;
  nameEn: string;
  nameZh: string;
}

export default function ClinicResultsPage() {
  const [, params] = useRoute("/emergency-results/:requestId");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const { toast } = useToast();

  // Fetch emergency request to get location
  const { data: emergencyRequest } = useQuery<any>({
    queryKey: ['/api/emergency-requests', params?.requestId],
    enabled: !!params?.requestId,
  });

  // Fetch regions
  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ['/api/regions'],
  });

  // Fetch clinics
  const { data: allClinics = [] } = useQuery<Clinic[]>({
    queryKey: ['/api/clinics'],
  });

  // Set user location from emergency request
  useEffect(() => {
    if (emergencyRequest?.locationLatitude && emergencyRequest?.locationLongitude) {
      setUserLocation({
        lat: parseFloat(emergencyRequest.locationLatitude),
        lng: parseFloat(emergencyRequest.locationLongitude),
      });
    }
  }, [emergencyRequest]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter and sort clinics
  const filteredClinics = allClinics
    .filter(clinic => {
      // Filter by region if selected
      if (selectedRegion !== "all") {
        const region = regions.find(r => r.code === selectedRegion);
        if (region && clinic.regionId !== region.id) {
          return false;
        }
      }
      return clinic.status === 'active';
    })
    .map(clinic => {
      // Calculate distance if user location and clinic location are available
      if (userLocation && clinic.latitude && clinic.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          parseFloat(clinic.latitude),
          parseFloat(clinic.longitude)
        );
        return { ...clinic, distance };
      }
      return clinic;
    })
    .sort((a, b) => {
      // Prioritize clinics with known distance
      const distA = a.distance !== undefined ? a.distance : Infinity;
      const distB = b.distance !== undefined ? b.distance : Infinity;
      
      if (distA !== distB) {
        return distA - distB;
      }
      
      // If distances are equal (or both undefined), sort 24-hour clinics first
      if (a.is24Hour && !b.is24Hour) return -1;
      if (!a.is24Hour && b.is24Hour) return 1;
      
      return 0;
    });

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsapp: string, clinicName: string) => {
    const message = emergencyRequest
      ? `Emergency: ${emergencyRequest.symptom}. Contact: ${emergencyRequest.contactPhone}`
      : `I need emergency pet care`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
  };

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const clinicIds = filteredClinics
        .filter(c => c.whatsapp || c.email)
        .map(c => c.id);
      
      let locationInfo = emergencyRequest?.locationText || 'Location not provided';
      if (emergencyRequest?.locationLatitude && emergencyRequest?.locationLongitude) {
        const mapsLink = `https://www.google.com/maps?q=${emergencyRequest.locationLatitude},${emergencyRequest.locationLongitude}`;
        locationInfo = emergencyRequest.locationText 
          ? `${emergencyRequest.locationText}\nMap: ${mapsLink}`
          : `GPS: ${emergencyRequest.locationLatitude}, ${emergencyRequest.locationLongitude}\nMap: ${mapsLink}`;
      }
      
      const message = emergencyRequest
        ? `🚨 PET EMERGENCY ALERT 🚨\n\nSymptom: ${emergencyRequest.symptom}\nLocation: ${locationInfo}\nContact: ${emergencyRequest.contactPhone}\n${emergencyRequest.contactEmail ? `Email: ${emergencyRequest.contactEmail}` : ''}\n\nPlease respond urgently if you can help.`
        : 'Emergency pet care needed';
      
      const response = await apiRequest(
        'POST',
        `/api/emergency-requests/${params?.requestId}/broadcast`,
        { clinicIds, message }
      );
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-requests', params?.requestId] });
      toast({
        title: "Broadcast sent successfully!",
        description: `Emergency alert sent to ${data.count} ${data.count === 1 ? 'clinic' : 'clinics'}`,
      });
      setShowBroadcastDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Broadcast failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBroadcast = () => {
    broadcastMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nearby 24-Hour Clinics</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredClinics.length} clinics found
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" data-testid="button-home">Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filter and Broadcast Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-full md:w-64" data-testid="select-region">
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.code}>
                  {region.nameEn} ({region.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setShowBroadcastDialog(true)}
            className="bg-orange-600 hover:bg-orange-700 w-full md:w-auto"
            disabled={filteredClinics.filter(c => c.whatsapp || c.email).length === 0}
            data-testid="button-broadcast"
          >
            <Send className="h-4 w-4 mr-2" />
            Broadcast to All Clinics
          </Button>
        </div>

        {/* Clinics List */}
        <div className="space-y-4">
          {filteredClinics.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No clinics found in this region</p>
              </CardContent>
            </Card>
          ) : (
            filteredClinics.map((clinic) => (
              <Card key={clinic.id} className="hover:shadow-lg transition-shadow" data-testid={`card-clinic-${clinic.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {clinic.name}
                        {clinic.nameZh && (
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {clinic.nameZh}
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {clinic.is24Hour && (
                          <Badge className="bg-green-600" data-testid="badge-24hour">
                            <Clock className="h-3 w-3 mr-1" />
                            24 Hours
                          </Badge>
                        )}
                        {clinic.distance !== undefined && (
                          <Badge variant="outline" data-testid="badge-distance">
                            <Navigation className="h-3 w-3 mr-1" />
                            {clinic.distance.toFixed(1)} km away
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <MapPin className="h-5 w-5 mt-0.5 text-gray-500" />
                      <div>
                        <p>{clinic.address}</p>
                        {clinic.addressZh && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{clinic.addressZh}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-3">
                      <Button
                        onClick={() => handleCall(clinic.phone)}
                        className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700"
                        data-testid={`button-call-${clinic.id}`}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </Button>
                      {clinic.whatsapp && (
                        <Button
                          onClick={() => handleWhatsApp(clinic.whatsapp!, clinic.name)}
                          className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700"
                          data-testid={`button-whatsapp-${clinic.id}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Emergency Note */}
        <div className="mt-8 p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
          <p className="text-red-800 dark:text-red-200 font-medium">
            For life-threatening emergencies, call 999 immediately
          </p>
        </div>
      </div>

      {/* Broadcast Confirmation Dialog */}
      <AlertDialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Broadcast Emergency Alert</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-4">
                  This will send your emergency alert to {filteredClinics.filter(c => c.whatsapp || c.email).length} clinics via WhatsApp and email.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <strong className="text-sm font-semibold text-gray-700 dark:text-gray-300">Message Preview:</strong>
                  <pre className="mt-2 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-sans">
                    {(() => {
                      let locationInfo = emergencyRequest?.locationText || 'Location not provided';
                      if (emergencyRequest?.locationLatitude && emergencyRequest?.locationLongitude) {
                        const mapsLink = `https://www.google.com/maps?q=${emergencyRequest.locationLatitude},${emergencyRequest.locationLongitude}`;
                        locationInfo = emergencyRequest.locationText 
                          ? `${emergencyRequest.locationText}\nMap: ${mapsLink}`
                          : `GPS: ${emergencyRequest.locationLatitude}, ${emergencyRequest.locationLongitude}\nMap: ${mapsLink}`;
                      }
                      return emergencyRequest
                        ? `🚨 PET EMERGENCY ALERT 🚨\n\nSymptom: ${emergencyRequest.symptom}\nLocation: ${locationInfo}\nContact: ${emergencyRequest.contactPhone}\n${emergencyRequest.contactEmail ? `Email: ${emergencyRequest.contactEmail}` : ''}\n\nPlease respond urgently if you can help.`
                        : 'Emergency pet care needed';
                    })()}
                  </pre>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-broadcast">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBroadcast}
              disabled={broadcastMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-confirm-broadcast"
            >
              {broadcastMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Broadcast
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
