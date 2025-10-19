import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, MapPin, Clock, Navigation, Send, Loader2, BarChart3, AlertCircle, Search, Filter, CheckCircle2, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { analytics } from "@/lib/analytics";
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
  isAvailable: boolean;
  isSupportHospital: boolean;
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

// Helper function to build enhanced pet info string
function buildPetInfoString(emergencyRequest: any, t: any, targetClinicId?: string): string {
  if (!emergencyRequest?.petSpecies) return '';
  
  let petInfo = `\n${t('clinic_results.pet', 'Pet')}: `;
  
  // If we have full pet profile data
  if (emergencyRequest.pet) {
    const pet = emergencyRequest.pet;
    // Add pet name if available
    if (pet.name) {
      petInfo += `${pet.name} (`;
    }
    
    // Add species, breed, age
    petInfo += emergencyRequest.petSpecies;
    if (emergencyRequest.petBreed) {
      petInfo += `, ${emergencyRequest.petBreed}`;
    }
    if (emergencyRequest.petAge) {
      petInfo += `, ${emergencyRequest.petAge} ${t('common.years', 'years')}`;
    }
    
    // Add weight if available
    if (pet.weight) {
      petInfo += `, ${pet.weight}${t('clinic_results.weight_kg', 'kg')}`;
    }
    
    if (pet.name) {
      petInfo += ')';
    }
    
    // Add medical notes if available
    if (pet.medicalNotes && pet.medicalNotes.trim()) {
      petInfo += `\n${t('clinic_results.medical_history', '⚠️ Medical History')}: ${pet.medicalNotes}`;
    }
    
    // Highlight if this pet is an existing patient of the target clinic
    if (targetClinicId && pet.lastVisitClinicId === targetClinicId) {
      petInfo += `\n⭐ ${t('clinic_results.existing_patient', 'EXISTING PATIENT - Medical records available')}`;
      if (pet.lastVisitDate) {
        const visitDate = new Date(pet.lastVisitDate).toLocaleDateString();
        petInfo += ` (${t('clinic_results.last_visit', 'Last visit')}: ${visitDate})`;
      }
    }
  } else {
    // Fallback to emergency request data only (manual entry)
    petInfo += emergencyRequest.petSpecies;
    if (emergencyRequest.petBreed) {
      petInfo += `, ${emergencyRequest.petBreed}`;
    }
    if (emergencyRequest.petAge) {
      petInfo += ` (${emergencyRequest.petAge} ${t('common.years', 'years')})`;
    }
  }
  
  return petInfo;
}

export default function ClinicResultsPage() {
  const { t, language } = useTranslation();
  const [, params] = useRoute("/emergency-results/:requestId");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [distanceFilter, setDistanceFilter] = useState<string>("all");
  const [only24Hour, setOnly24Hour] = useState(true);
  const [onlyWhatsApp, setOnlyWhatsApp] = useState(false);
  const [selectedClinics, setSelectedClinics] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
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
      // Only active clinics
      if (clinic.status !== 'active') return false;
      
      // Filter by region if selected
      if (selectedRegion !== "all") {
        const region = regions.find(r => r.code === selectedRegion);
        if (region && clinic.regionId !== region.id) {
          return false;
        }
      }
      
      // Filter by 24-hour service
      if (only24Hour && !clinic.is24Hour) {
        return false;
      }
      
      // Filter by WhatsApp availability
      if (onlyWhatsApp && !clinic.whatsapp) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = clinic.name.toLowerCase().includes(query);
        const nameZhMatch = clinic.nameZh?.toLowerCase().includes(query);
        const addressMatch = clinic.address.toLowerCase().includes(query);
        const addressZhMatch = clinic.addressZh?.toLowerCase().includes(query);
        
        if (!nameMatch && !nameZhMatch && !addressMatch && !addressZhMatch) {
          return false;
        }
      }
      
      return true;
    })
    .map(clinic => {
      // Calculate distance if user location and clinic location are available
      if (userLocation && clinic.latitude && clinic.longitude) {
        const lat = parseFloat(clinic.latitude);
        const lng = parseFloat(clinic.longitude);
        
        // Only calculate distance if we got valid numbers
        if (!isNaN(lat) && !isNaN(lng)) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            lat,
            lng
          );
          return { ...clinic, distance };
        }
      }
      return clinic;
    })
    .filter(clinic => {
      // Filter by distance if selected
      if (distanceFilter !== "all") {
        // When distance filter is active, exclude clinics without distance data
        if (clinic.distance === undefined) {
          return false;
        }
        const maxDistance = parseFloat(distanceFilter);
        if (clinic.distance > maxDistance) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      // HIGHEST PRIORITY: Existing patient clinic (where pet has visited before)
      const petLastVisitClinicId = emergencyRequest?.pet?.lastVisitClinicId;
      const aIsExisting = petLastVisitClinicId === a.id;
      const bIsExisting = petLastVisitClinicId === b.id;
      
      if (aIsExisting && !bIsExisting) return -1;
      if (!aIsExisting && bIsExisting) return 1;
      
      // SECOND PRIORITY: Clinics with known distance
      const distA = a.distance !== undefined ? a.distance : Infinity;
      const distB = b.distance !== undefined ? b.distance : Infinity;
      
      if (distA !== distB) {
        return distA - distB;
      }
      
      // THIRD PRIORITY: 24-hour clinics
      if (a.is24Hour && !b.is24Hour) return -1;
      if (!a.is24Hour && b.is24Hour) return 1;
      
      return 0;
    });

  const handleCall = (phone: string, clinicId: string, clinicName: string) => {
    // Track clinic contact in analytics
    analytics.trackClinicContact({
      clinicId,
      contactMethod: 'call',
      clinicName,
    });
    
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsapp: string, clinicId: string, clinicName: string) => {
    // Track clinic contact in analytics
    analytics.trackClinicContact({
      clinicId,
      contactMethod: 'whatsapp',
      clinicName,
    });
    
    const message = emergencyRequest
      ? `${t('clinic_results.whatsapp_message_emergency', 'Emergency')}: ${emergencyRequest.symptom}. ${t('clinic_results.whatsapp_message_contact', 'Contact')}: ${emergencyRequest.contactPhone}`
      : t('clinic_results.whatsapp_message_request', 'I need emergency pet care');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
  };

  const handleOpenMaps = (latitude: string, longitude: string, clinicName: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(mapsUrl, '_blank');
  };

  const toggleClinicSelection = (clinicId: string) => {
    setSelectedClinics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clinicId)) {
        newSet.delete(clinicId);
      } else {
        newSet.add(clinicId);
      }
      return newSet;
    });
  };

  const selectAllClinics = () => {
    const allEligible = filteredClinics
      .filter(c => c.whatsapp || c.email)
      .map(c => c.id);
    setSelectedClinics(new Set(allEligible));
  };

  const deselectAllClinics = () => {
    setSelectedClinics(new Set());
  };

  // Quick stats
  const clinicsWithin5km = filteredClinics.filter(c => c.distance !== undefined && c.distance <= 5).length;
  const clinicsWith24Hour = filteredClinics.filter(c => c.is24Hour).length;
  const clinicsWithWhatsApp = filteredClinics.filter(c => c.whatsapp).length;
  
  // Check if GPS-based filtering is possible
  const hasUserGPS = !!(userLocation?.lat && userLocation?.lng);
  const clinicsWithGPS = allClinics.filter(c => c.latitude && c.longitude).length;
  const canUseDistanceFilter = hasUserGPS && clinicsWithGPS > 0;

  // Reset distance filter if GPS becomes unavailable
  useEffect(() => {
    if (!canUseDistanceFilter && distanceFilter !== "all") {
      setDistanceFilter("all");
    }
  }, [canUseDistanceFilter, distanceFilter]);

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const clinicIds = selectedClinics.size > 0 
        ? Array.from(selectedClinics)
        : filteredClinics
            .filter(c => c.whatsapp || c.email)
            .map(c => c.id);
      
      let locationInfo = emergencyRequest?.locationText || t('clinic_results.location_not_provided', 'Location not provided');
      if (emergencyRequest?.locationLatitude && emergencyRequest?.locationLongitude) {
        const mapsLink = `https://www.google.com/maps?q=${emergencyRequest.locationLatitude},${emergencyRequest.locationLongitude}`;
        locationInfo = emergencyRequest.locationText 
          ? `${emergencyRequest.locationText}\n${t('clinic_results.map', 'Map')}: ${mapsLink}`
          : `${t('clinic_results.gps_prefix', 'GPS')}: ${emergencyRequest.locationLatitude}, ${emergencyRequest.locationLongitude}\n${t('clinic_results.map', 'Map')}: ${mapsLink}`;
      }
      
      // Build pet info string with enhanced profile data (no specific clinic targeting for group broadcast)
      const petInfo = buildPetInfoString(emergencyRequest, t);
      
      // Build voice recording section if available
      const voiceSection = emergencyRequest?.voiceTranscript 
        ? `\n\n🎤 ${t('clinic_results.voice_description', 'Voice Description')}:\n"${emergencyRequest.voiceTranscript}"\n\n${t('clinic_results.ai_analysis', 'AI Analysis')}: ${emergencyRequest.aiAnalyzedSymptoms || emergencyRequest.symptom}`
        : '';
      
      // Add information about pet's regular clinic if exists
      let regularClinicInfo = '';
      if (emergencyRequest?.pet?.lastVisitClinicId) {
        const regularClinic = allClinics.find(c => c.id === emergencyRequest.pet.lastVisitClinicId);
        if (regularClinic) {
          regularClinicInfo = `\n\n📋 ${t('clinic_results.regular_clinic_note', 'NOTE: This pet is a registered patient at')} ${regularClinic.name}`;
          if (emergencyRequest.pet.lastVisitDate) {
            const visitDate = new Date(emergencyRequest.pet.lastVisitDate).toLocaleDateString();
            regularClinicInfo += ` (${t('clinic_results.last_visit', 'Last visit')}: ${visitDate})`;
          }
          regularClinicInfo += `\n${t('clinic_results.medical_records_available', 'Medical records may be available there for reference.')}`;
        }
      }
      
      const message = emergencyRequest
        ? `🚨 ${t('clinic_results.broadcast_alert_title', 'PET EMERGENCY ALERT')} 🚨\n\n${t('clinic_results.symptoms', 'Symptoms')}: ${emergencyRequest.symptom}${voiceSection}${petInfo}${regularClinicInfo}\n${t('clinic_results.location', 'Location')}: ${locationInfo}\n${t('clinic_results.contact', 'Contact')}: ${emergencyRequest.contactPhone}\n${emergencyRequest.contactEmail ? `${t('common.email', 'Email')}: ${emergencyRequest.contactEmail}` : ''}\n\n${t('clinic_results.broadcast_alert_footer', 'Please respond urgently if you can help.')}`
        : t('clinic_results.emergency_care_needed', 'Emergency pet care needed');
      
      const response = await apiRequest(
        'POST',
        `/api/emergency-requests/${params?.requestId}/broadcast`,
        { clinicIds, message }
      );
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-requests', params?.requestId] });
      
      // Track broadcast in analytics
      analytics.trackBroadcast({
        requestId: params?.requestId || '',
        clinicsCount: data.count,
        petType: emergencyRequest?.petSpecies || 'unknown',
      });
      
      toast({
        title: t('clinic_results.broadcast_success', 'Broadcast sent successfully!'),
        description: language === 'zh-HK' 
          ? `✅ 毛孩緊急通知已發送至 ${data.count} 間診所。點擊「查看廣播狀態」追蹤發送情況。`
          : `✅ Sent to ${data.count} ${data.count === 1 ? 'clinic' : 'clinics'}. Click "View Broadcast Status" to track delivery.`,
        duration: 8000, // Show longer for important message
      });
      setShowBroadcastDialog(false);
      setSelectedClinics(new Set());
      
      // Scroll to top to show the View Status button
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error: Error) => {
      toast({
        title: t('clinic_results.broadcast_failed', 'Broadcast failed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBroadcast = () => {
    broadcastMutation.mutate();
  };

  const broadcastTargetCount = selectedClinics.size > 0 
    ? selectedClinics.size 
    : filteredClinics.filter(c => c.whatsapp || c.email).length;

  // Count support hospitals (only active ones)
  const supportHospitals24h = allClinics.filter(c => 
    c.status === 'active' &&
    c.isSupportHospital && 
    c.is24Hour && 
    c.isAvailable && 
    (c.whatsapp || c.email)
  );

  // Quick broadcast to all 24-hour support hospitals
  const quickBroadcastMutation = useMutation({
    mutationFn: async () => {
      const clinicIds = supportHospitals24h.map(c => c.id);
      
      if (clinicIds.length === 0) {
        throw new Error('No 24-hour support hospitals available');
      }
      
      let locationInfo = emergencyRequest?.locationText || t('clinic_results.location_not_provided', 'Location not provided');
      if (emergencyRequest?.locationLatitude && emergencyRequest?.locationLongitude) {
        const mapsLink = `https://www.google.com/maps?q=${emergencyRequest.locationLatitude},${emergencyRequest.locationLongitude}`;
        locationInfo = emergencyRequest.locationText 
          ? `${emergencyRequest.locationText}\n${t('clinic_results.map', 'Map')}: ${mapsLink}`
          : `${t('clinic_results.gps_prefix', 'GPS')}: ${emergencyRequest.locationLatitude}, ${emergencyRequest.locationLongitude}\n${t('clinic_results.map', 'Map')}: ${mapsLink}`;
      }
      
      // Build pet info string with enhanced profile data
      const petInfo = buildPetInfoString(emergencyRequest, t);
      
      // Build voice recording section if available
      const voiceSection = emergencyRequest?.voiceTranscript 
        ? `\n\n🎤 ${t('clinic_results.voice_description', 'Voice Description')}:\n"${emergencyRequest.voiceTranscript}"\n\n${t('clinic_results.ai_analysis', 'AI Analysis')}: ${emergencyRequest.aiAnalyzedSymptoms || emergencyRequest.symptom}`
        : '';
      
      // Add information about pet's regular clinic if exists
      let regularClinicInfo = '';
      if (emergencyRequest?.pet?.lastVisitClinicId) {
        const regularClinic = allClinics.find(c => c.id === emergencyRequest.pet.lastVisitClinicId);
        if (regularClinic) {
          regularClinicInfo = `\n\n📋 ${t('clinic_results.regular_clinic_note', 'NOTE: This pet is a registered patient at')} ${regularClinic.name}`;
          if (emergencyRequest.pet.lastVisitDate) {
            const visitDate = new Date(emergencyRequest.pet.lastVisitDate).toLocaleDateString();
            regularClinicInfo += ` (${t('clinic_results.last_visit', 'Last visit')}: ${visitDate})`;
          }
          regularClinicInfo += `\n${t('clinic_results.medical_records_available', 'Medical records may be available there for reference.')}`;
        }
      }
      
      const message = emergencyRequest
        ? `🚨 ${t('clinic_results.broadcast_alert_title', 'PET EMERGENCY ALERT')} 🚨\n\n${t('clinic_results.symptoms', 'Symptoms')}: ${emergencyRequest.symptom}${voiceSection}${petInfo}${regularClinicInfo}\n${t('clinic_results.location', 'Location')}: ${locationInfo}\n${t('clinic_results.contact', 'Contact')}: ${emergencyRequest.contactPhone}\n${emergencyRequest.contactEmail ? `${t('common.email', 'Email')}: ${emergencyRequest.contactEmail}` : ''}\n\n${t('clinic_results.broadcast_alert_footer', 'Please respond urgently if you can help.')}`
        : t('clinic_results.emergency_care_needed', 'Emergency pet care needed');
      
      const response = await apiRequest(
        'POST',
        `/api/emergency-requests/${params?.requestId}/broadcast`,
        { clinicIds, message }
      );
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (params?.requestId) {
        queryClient.invalidateQueries({ queryKey: ['/api/emergency-requests', params.requestId] });
      }
      
      // Track quick broadcast in analytics
      analytics.trackBroadcast({
        requestId: params?.requestId || '',
        clinicsCount: data.count,
        petType: emergencyRequest?.petSpecies || 'unknown',
      });
      
      toast({
        title: t('clinic_results.broadcast_success', 'Emergency Alert Sent!'),
        description: language === 'zh-HK'
          ? `✅ 毛孩緊急通知已發送至 ${data.count} 間24小時診所。點擊「查看廣播狀態」追蹤發送情況。`
          : `✅ Broadcast sent to ${data.count} 24-hour support ${data.count === 1 ? 'hospital' : 'hospitals'}. Click "View Broadcast Status" to track delivery.`,
        duration: 8000,
      });
      
      // Scroll to top to show the View Status button
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error: Error) => {
      toast({
        title: t('clinic_results.broadcast_failed', 'Broadcast failed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('clinic_results.title', 'Emergency Clinic Results')}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredClinics.length} {t('clinic_results.clinics_found', filteredClinics.length === 1 ? 'clinic found' : 'clinics found')}
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" data-testid="button-home">{t('common.home', 'Home')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Emergency Request Summary */}
        {emergencyRequest && (
          <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" data-testid="card-emergency-summary">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1" />
                <div className="flex-1">
                  <CardTitle className="text-lg text-red-900 dark:text-red-100">{t('clinic_results.emergency_request', 'Emergency Request')}</CardTitle>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                    <strong>{t('clinic_results.symptoms', 'Symptoms')}:</strong> {emergencyRequest.symptom}
                  </p>
                  {emergencyRequest.petSpecies && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1" data-testid="text-pet-details">
                      <strong>{t('clinic_results.pet', 'Pet')}:</strong> {emergencyRequest.petSpecies}
                      {emergencyRequest.petBreed && `, ${emergencyRequest.petBreed}`}
                      {emergencyRequest.petAge && ` (${emergencyRequest.petAge} ${t('common.years', 'years')})`}
                    </p>
                  )}
                  {emergencyRequest.locationText && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      <strong>{t('clinic_results.location', 'Location')}:</strong> {emergencyRequest.locationText}
                    </p>
                  )}
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    <strong>{t('clinic_results.contact', 'Contact')}:</strong> {emergencyRequest.contactPhone}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Quick Broadcast Button - PROMINENT */}
        {emergencyRequest && supportHospitals24h.length > 0 && params?.requestId && (
          <Card className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 border-0 shadow-lg" data-testid="card-quick-broadcast">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4 text-white">
                  <Send className="h-10 w-10 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold mb-1">🚨 INSTANT EMERGENCY BROADCAST</h3>
                    <p className="text-sm text-red-50">
                      Send alert to {supportHospitals24h.length} available 24-hour support {supportHospitals24h.length === 1 ? 'hospital' : 'hospitals'} NOW
                    </p>
                    <p className="text-xs text-red-100 mt-2">
                      ⚡ Fastest way to get help - One click to reach all partner hospitals
                    </p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => quickBroadcastMutation.mutate()}
                  disabled={quickBroadcastMutation.isPending}
                  className="bg-white text-red-600 hover:bg-red-50 font-bold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
                  data-testid="button-quick-broadcast"
                >
                  {quickBroadcastMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      BROADCAST NOW
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Statistics - Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card data-testid="stat-total" className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredClinics.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t('clinic_results.total_clinics', 'Total Clinics')}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-24hour" className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{clinicsWith24Hour}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t('clinic_results.24hour', '24-Hour')}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-whatsapp" className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{clinicsWithWhatsApp}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t('clinic_results.whatsapp', 'WhatsApp')}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-nearby" className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{clinicsWithin5km}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t('clinic_results.within_5km', 'Within 5km')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card data-testid="card-filters">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('clinic_results.filters_search', 'Filters & Search')}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? t('clinic_results.hide_filters', 'Hide Filters') : t('clinic_results.show_filters', 'Show Filters')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('clinic_results.search_placeholder', 'Search clinics by name or address...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {/* Quick 24-Hour Toggle - Always Visible */}
            <div className="flex items-center space-x-2 pt-1">
              <Switch
                id="24hour-quick-filter"
                checked={only24Hour}
                onCheckedChange={setOnly24Hour}
                data-testid="switch-24hour-quick"
              />
              <Label htmlFor="24hour-quick-filter" className="cursor-pointer font-medium">
                <Clock className="inline h-4 w-4 mr-1.5 text-green-600" />
                {t('clinic_results.24hour_only', '24-Hour Clinics Only')}
              </Label>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {/* Region Filter */}
                <div>
                  <Label className="text-sm mb-2 block">{t('clinic_results.region', 'Region')}</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger data-testid="select-region">
                      <SelectValue placeholder={t('clinic_results.all_regions', 'All Regions')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('clinic_results.all_regions', 'All Regions')}</SelectItem>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.code}>
                          {language === 'zh-HK' ? region.nameZh : region.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Distance Filter */}
                <div>
                  <Label className="text-sm mb-2 block">{t('clinic_results.distance', 'Distance')}</Label>
                  {canUseDistanceFilter ? (
                    <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                      <SelectTrigger data-testid="select-distance">
                        <SelectValue placeholder={t('clinic_results.any_distance', 'Any Distance')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('clinic_results.any_distance', 'Any Distance')}</SelectItem>
                        <SelectItem value="5">{t('clinic_results.within_5km', 'Within 5 km')}</SelectItem>
                        <SelectItem value="10">{t('clinic_results.within_10km', 'Within 10 km')}</SelectItem>
                        <SelectItem value="15">{t('clinic_results.within_15km', 'Within 15 km')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>
                      <Select disabled value="all">
                        <SelectTrigger data-testid="select-distance-disabled" className="opacity-50">
                          <SelectValue placeholder={t('clinic_results.gps_not_available', 'GPS Not Available')} />
                        </SelectTrigger>
                      </Select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {!hasUserGPS 
                          ? t('clinic_results.enable_gps', 'Enable GPS on Step 2 for distance filtering')
                          : t('clinic_results.no_gps_data', 'No clinic GPS data available')}
                      </p>
                    </div>
                  )}
                </div>

                {/* 24-Hour Toggle */}
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="24hour-filter"
                    checked={only24Hour}
                    onCheckedChange={setOnly24Hour}
                    data-testid="switch-24hour"
                  />
                  <Label htmlFor="24hour-filter" className="cursor-pointer">
                    {t('clinic_results.24hour_only_short', '24-Hour Only')}
                  </Label>
                </div>

                {/* WhatsApp Toggle */}
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="whatsapp-filter"
                    checked={onlyWhatsApp}
                    onCheckedChange={setOnlyWhatsApp}
                    data-testid="switch-whatsapp"
                  />
                  <Label htmlFor="whatsapp-filter" className="cursor-pointer">
                    {t('clinic_results.whatsapp_only', 'WhatsApp Only')}
                  </Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Broadcast Controls */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            {selectedClinics.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {selectedClinics.size} {t('clinic_results.clinics_selected', selectedClinics.size !== 1 ? 'clinics selected' : 'clinic selected')}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllClinics}
                  data-testid="button-deselect-all"
                >
                  {t('clinic_results.clear_selection', 'Clear Selection')}
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/emergency-results/${params?.requestId}/messages`}>
              <Button
                variant="outline"
                className="border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                data-testid="button-view-status"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('clinic_results.view_status', 'View Broadcast Status')}
              </Button>
            </Link>
            <Button
              onClick={() => setShowBroadcastDialog(true)}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={broadcastTargetCount === 0}
              data-testid="button-broadcast"
            >
              <Send className="h-4 w-4 mr-2" />
              {t('clinic_results.broadcast', 'Broadcast')} {selectedClinics.size > 0 ? `(${selectedClinics.size})` : t('clinic_results.to_all', 'to All')}
            </Button>
          </div>
        </div>

        {/* Clinics List */}
        <div className="space-y-4">
          {filteredClinics.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{t('clinic_results.no_clinics', 'No clinics found')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t('clinic_results.adjust_filters', 'Try adjusting your filters or search criteria')}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClinics.map((clinic, index) => {
              const isSelected = selectedClinics.has(clinic.id);
              const canBroadcast = !!(clinic.whatsapp || clinic.email);
              const isExistingPatient = emergencyRequest?.pet?.lastVisitClinicId === clinic.id;
              
              return (
                <Card 
                  key={clinic.id} 
                  className={`hover:shadow-lg transition-all ${isSelected ? 'ring-2 ring-orange-500' : ''} ${isExistingPatient ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''}`}
                  data-testid={`card-clinic-${clinic.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox */}
                      {canBroadcast && (
                        <div className="pt-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleClinicSelection(clinic.id)}
                            data-testid={`checkbox-clinic-${clinic.id}`}
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        {/* Existing Patient Indicator - Highest Priority */}
                        {isExistingPatient && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 mb-2 font-bold" data-testid={`badge-existing-patient-${clinic.id}`}>
                            ⭐ {t('clinic_results.existing_patient_badge', 'EXISTING PATIENT - Medical Records Available')}
                          </Badge>
                        )}
                        
                        <CardTitle className="text-xl mb-2">
                          {language === 'zh-HK' && clinic.nameZh ? clinic.nameZh : clinic.name}
                        </CardTitle>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {clinic.isAvailable ? (
                            <Badge className="bg-green-600" data-testid={`badge-available-${clinic.id}`}>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {t('clinic_results.available_now', 'Available Now')}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500" data-testid={`badge-unavailable-${clinic.id}`}>
                              {t('clinic_results.unavailable', 'Unavailable')}
                            </Badge>
                          )}
                          {clinic.is24Hour && (
                            <Badge className="bg-blue-600" data-testid={`badge-24hour-${clinic.id}`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {t('clinic_results.24_hours', '24 Hours')}
                            </Badge>
                          )}
                          {clinic.isSupportHospital && (
                            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 font-semibold" data-testid={`badge-support-hospital-${clinic.id}`}>
                              ⭐ PetSOS Partner
                            </Badge>
                          )}
                          {clinic.distance !== undefined && (
                            <Badge variant="outline" data-testid={`badge-distance-${clinic.id}`}>
                              <Navigation className="h-3 w-3 mr-1" />
                              {clinic.distance.toFixed(1)} {t('clinic_results.km', 'km')}
                            </Badge>
                          )}
                          {clinic.whatsapp && (
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {t('clinic_results.whatsapp', 'WhatsApp')}
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
                        <div className="flex-1">
                          <p>{language === 'zh-HK' && clinic.addressZh ? clinic.addressZh : clinic.address}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-3">
                        <Button
                          onClick={() => handleCall(clinic.phone, clinic.id, clinic.name)}
                          className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700"
                          data-testid={`button-call-${clinic.id}`}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          {t('clinic_results.call', 'Call')}
                        </Button>
                        {clinic.whatsapp && (
                          <Button
                            onClick={() => handleWhatsApp(clinic.whatsapp!, clinic.id, clinic.name)}
                            className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700"
                            data-testid={`button-whatsapp-${clinic.id}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {t('clinic_results.whatsapp', 'WhatsApp')}
                          </Button>
                        )}
                        {clinic.latitude && clinic.longitude && (
                          <Button
                            onClick={() => handleOpenMaps(clinic.latitude!, clinic.longitude!, clinic.name)}
                            variant="outline"
                            className="flex-1 min-w-[120px]"
                            data-testid={`button-maps-${clinic.id}`}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Maps
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg text-center">
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            {t("app.disclaimer", "⚠️ PetSOS provides emergency guidance only and is not medical advice. If in doubt, contact a vet immediately.")}
          </p>
        </div>
      </div>

      {/* Broadcast Confirmation Dialog */}
      <AlertDialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedClinics.size > 0 ? t('clinic_results.broadcast_to_selected', 'Broadcast to Selected Clinics') : t('clinic_results.broadcast_emergency', 'Broadcast Emergency Alert')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-4">
                  {selectedClinics.size > 0 ? (
                    <>
                      {t('clinic_results.broadcast_desc_selected', `This will send your emergency alert to ${broadcastTargetCount} selected ${broadcastTargetCount === 1 ? 'clinic' : 'clinics'} via WhatsApp and email.`)}
                    </>
                  ) : (
                    <>
                      {t('clinic_results.broadcast_desc_all', `This will send your emergency alert to all ${broadcastTargetCount} clinics via WhatsApp and email.`)}
                    </>
                  )}
                </p>
                
                {selectedClinics.size === 0 && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {t('clinic_results.broadcast_tip', '💡 Tip: Select specific clinics using the checkboxes to send a targeted broadcast')}
                    </p>
                  </div>
                )}
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <strong className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('clinic_results.message_preview', 'Message Preview')}:</strong>
                  <pre className="mt-2 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-sans">
                    {(() => {
                      let locationInfo = emergencyRequest?.locationText || t('clinic_results.location_not_provided', 'Location not provided');
                      if (emergencyRequest?.locationLatitude && emergencyRequest?.locationLongitude) {
                        const mapsLink = `https://www.google.com/maps?q=${emergencyRequest.locationLatitude},${emergencyRequest.locationLongitude}`;
                        locationInfo = emergencyRequest.locationText 
                          ? `${emergencyRequest.locationText}\n${t('clinic_results.map', 'Map')}: ${mapsLink}`
                          : `${t('clinic_results.gps_prefix', 'GPS')}: ${emergencyRequest.locationLatitude}, ${emergencyRequest.locationLongitude}\n${t('clinic_results.map', 'Map')}: ${mapsLink}`;
                      }
                      
                      // Build pet info string with enhanced profile data
                      const petInfo = buildPetInfoString(emergencyRequest, t);
                      
                      return emergencyRequest
                        ? `🚨 ${t('clinic_results.broadcast_alert_title', 'PET EMERGENCY ALERT')} 🚨\n\n${t('clinic_results.symptoms', 'Symptoms')}: ${emergencyRequest.symptom}${petInfo}\n${t('clinic_results.location', 'Location')}: ${locationInfo}\n${t('clinic_results.contact', 'Contact')}: ${emergencyRequest.contactPhone}\n${emergencyRequest.contactEmail ? `${t('common.email', 'Email')}: ${emergencyRequest.contactEmail}` : ''}\n\n${t('clinic_results.broadcast_alert_footer', 'Please respond urgently if you can help.')}`
                        : t('clinic_results.emergency_care_needed', 'Emergency pet care needed');
                    })()}
                  </pre>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-broadcast">{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBroadcast}
              disabled={broadcastMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-confirm-broadcast"
            >
              {broadcastMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('clinic_results.send_to_clinics', `Send to ${broadcastTargetCount} ${broadcastTargetCount === 1 ? 'Clinic' : 'Clinics'}`)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
