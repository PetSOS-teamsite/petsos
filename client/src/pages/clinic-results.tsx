import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, MapPin, Clock, Navigation, Send, Loader2, BarChart3, AlertCircle, Search, Filter, CheckCircle2, ExternalLink, Edit2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { analytics } from "@/lib/analytics";
import { formatPhoneForDisplay } from "@/lib/phoneUtils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// Helper function to build structured broadcast message with clear sections
function buildStructuredBroadcastMessage(
  emergencyRequest: any,
  t: any,
  allClinics: Clinic[]
): string {
  if (!emergencyRequest) return t('clinic_results.emergency_care_needed', 'Emergency pet care needed');
  
  const sections: string[] = [];
  
  // Header
  sections.push(`🚨 ${t('clinic_results.broadcast_alert_title', 'PET EMERGENCY ALERT')} 🚨`);
  sections.push('');
  
  // Section 1: Pet Information
  sections.push('═══════════════════════════');
  sections.push(`📋 ${t('clinic_results.pet_info_section', 'PET INFORMATION')}`);
  sections.push('═══════════════════════════');
  
  if (emergencyRequest.pet) {
    const pet = emergencyRequest.pet;
    if (pet.name) {
      sections.push(`${t('clinic_results.name', 'Name')}: ${pet.name}`);
    }
    
    let petDetails = emergencyRequest.petSpecies || '';
    if (emergencyRequest.petBreed) {
      petDetails += `, ${emergencyRequest.petBreed}`;
    }
    if (emergencyRequest.petAge) {
      petDetails += `, ${emergencyRequest.petAge} ${t('common.years', 'years')}`;
    }
    if (pet.weight) {
      petDetails += `, ${pet.weight}${t('clinic_results.weight_kg', 'kg')}`;
    }
    if (petDetails) {
      sections.push(`${t('clinic_results.details', 'Details')}: ${petDetails}`);
    }
    
    if (pet.medicalNotes && pet.medicalNotes.trim()) {
      sections.push(`⚠️ ${t('clinic_results.medical_history', 'Medical History')}: ${pet.medicalNotes}`);
    }
  } else {
    // Manual entry without profile
    let petDetails = emergencyRequest.petSpecies || '';
    if (emergencyRequest.petBreed) {
      petDetails += `, ${emergencyRequest.petBreed}`;
    }
    if (emergencyRequest.petAge) {
      petDetails += `, ${emergencyRequest.petAge} ${t('common.years', 'years')}`;
    }
    sections.push(`${t('clinic_results.pet', 'Pet')}: ${petDetails}`);
  }
  
  sections.push('');
  
  // Section 2: Emergency Details
  // For voice recordings, show AI analysis FIRST, then transcript
  if (emergencyRequest.voiceTranscript && emergencyRequest.aiAnalyzedSymptoms) {
    sections.push('═══════════════════════════');
    sections.push(`🤖 ${t('clinic_results.ai_analysis_section', 'AI EMERGENCY ANALYSIS')}`);
    sections.push('═══════════════════════════');
    sections.push(emergencyRequest.aiAnalyzedSymptoms);
    sections.push('');
    
    sections.push('═══════════════════════════');
    sections.push(`🎤 ${t('clinic_results.owner_description', 'OWNER\'S DESCRIPTION')}`);
    sections.push('═══════════════════════════');
    sections.push(`"${emergencyRequest.voiceTranscript}"`);
    sections.push('');
    
    sections.push('═══════════════════════════');
    sections.push(`📝 ${t('clinic_results.summary_section', 'SYMPTOM SUMMARY')}`);
    sections.push('═══════════════════════════');
    sections.push(emergencyRequest.symptom);
    sections.push('');
  } else if (emergencyRequest.voiceTranscript) {
    // Voice recording without AI analysis (fallback used)
    sections.push('═══════════════════════════');
    sections.push(`🎤 ${t('clinic_results.voice_description', 'VOICE DESCRIPTION')}`);
    sections.push('═══════════════════════════');
    sections.push(`"${emergencyRequest.voiceTranscript}"`);
    sections.push('');
    sections.push(`${t('clinic_results.symptoms', 'Symptoms')}: ${emergencyRequest.symptom}`);
    sections.push('');
  } else {
    // Regular text input (no voice recording)
    sections.push('═══════════════════════════');
    sections.push(`🚨 ${t('clinic_results.emergency_section', 'EMERGENCY DETAILS')}`);
    sections.push('═══════════════════════════');
    sections.push(`${t('clinic_results.symptoms', 'Symptoms')}: ${emergencyRequest.symptom}`);
    sections.push('');
  }
  
  // Section 3: Contact Information
  sections.push('═══════════════════════════');
  sections.push(`📞 ${t('clinic_results.contact_section', 'CONTACT INFORMATION')}`);
  sections.push('═══════════════════════════');
  
  const formattedPhone = formatPhoneForDisplay(emergencyRequest.contactPhone);
  sections.push(`${t('clinic_results.phone', 'Phone')}: ${formattedPhone}`);
  
  if (emergencyRequest.contactEmail) {
    sections.push(`${t('common.email', 'Email')}: ${emergencyRequest.contactEmail}`);
  }
  
  if (emergencyRequest.contactName) {
    sections.push(`${t('clinic_results.name', 'Name')}: ${emergencyRequest.contactName}`);
  }
  
  sections.push('');
  
  // Section 4: Location
  sections.push('═══════════════════════════');
  sections.push(`📍 ${t('clinic_results.location_section', 'LOCATION')}`);
  sections.push('═══════════════════════════');
  
  if (emergencyRequest.locationLatitude && emergencyRequest.locationLongitude) {
    const mapsLink = `https://www.google.com/maps?q=${emergencyRequest.locationLatitude},${emergencyRequest.locationLongitude}`;
    if (emergencyRequest.locationText) {
      sections.push(emergencyRequest.locationText);
    }
    sections.push(`GPS: ${emergencyRequest.locationLatitude}, ${emergencyRequest.locationLongitude}`);
    sections.push(`${t('clinic_results.map', 'Map')}: ${mapsLink}`);
  } else if (emergencyRequest.locationText) {
    sections.push(emergencyRequest.locationText);
  } else {
    sections.push(t('clinic_results.location_not_provided', 'Location not provided'));
  }
  
  // Add information about pet's regular clinic if exists
  if (emergencyRequest?.pet?.lastVisitClinicId) {
    const regularClinic = allClinics.find(c => c.id === emergencyRequest.pet.lastVisitClinicId);
    if (regularClinic) {
      sections.push('');
      sections.push(`📋 ${t('clinic_results.regular_clinic_note', 'NOTE: This pet is a registered patient at')} ${regularClinic.name}`);
      if (emergencyRequest.pet.lastVisitDate) {
        const visitDate = new Date(emergencyRequest.pet.lastVisitDate).toLocaleDateString();
        sections.push(`${t('clinic_results.last_visit', 'Last visit')}: ${visitDate}`);
      }
      sections.push(t('clinic_results.medical_records_available', 'Medical records may be available there for reference.'));
    }
  }
  
  sections.push('');
  sections.push('═══════════════════════════');
  sections.push(t('clinic_results.broadcast_alert_footer', 'Please respond urgently if you can help.'));
  
  return sections.join('\n');
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    contactName: "",
    contactPhone: "",
    symptom: "",
    manualLocation: "",
    locationLatitude: undefined as number | undefined,
    locationLongitude: undefined as number | undefined,
  });
  const [editGpsDetecting, setEditGpsDetecting] = useState(false);
  const [editGpsError, setEditGpsError] = useState<string | null>(null);
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
      
      // SECOND PRIORITY: Partner clinics
      if (a.isSupportHospital && !b.isSupportHospital) return -1;
      if (!a.isSupportHospital && b.isSupportHospital) return 1;
      
      // THIRD PRIORITY: Clinics with known distance
      const distA = a.distance !== undefined ? a.distance : Infinity;
      const distB = b.distance !== undefined ? b.distance : Infinity;
      
      if (distA !== distB) {
        return distA - distB;
      }
      
      // FOURTH PRIORITY: 24-hour clinics
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
      
      // Build structured message with clear sections and formatted phone
      const message = buildStructuredBroadcastMessage(emergencyRequest, t, allClinics);
      
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
      
      // Build structured message with clear sections and formatted phone
      const message = buildStructuredBroadcastMessage(emergencyRequest, t, allClinics);
      
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

  // Edit emergency request mutation
  const editRequestMutation = useMutation({
    mutationFn: async (data: typeof editFormData) => {
      const response = await apiRequest(
        'PATCH',
        `/api/emergency-requests/${params?.requestId}`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-requests', params?.requestId] });
      toast({
        title: t('clinic_results.edit_success', 'Emergency request updated'),
        description: t('clinic_results.edit_success_description', 'Your changes have been saved successfully.'),
      });
      setShowEditDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('clinic_results.edit_failed', 'Update failed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Open edit dialog with current data
  const handleOpenEditDialog = () => {
    if (emergencyRequest) {
      setEditFormData({
        contactName: emergencyRequest.contactName || "",
        contactPhone: emergencyRequest.contactPhone || "",
        symptom: emergencyRequest.symptom || "",
        manualLocation: emergencyRequest.manualLocation || "",
        locationLatitude: emergencyRequest.locationLatitude ? parseFloat(emergencyRequest.locationLatitude) : undefined,
        locationLongitude: emergencyRequest.locationLongitude ? parseFloat(emergencyRequest.locationLongitude) : undefined,
      });
      setEditGpsError(null);
      setShowEditDialog(true);
    }
  };

  // Detect GPS location for edit dialog
  const handleEditUseGps = () => {
    if ("geolocation" in navigator) {
      setEditGpsDetecting(true);
      setEditGpsError(null);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setEditFormData(prev => ({
            ...prev,
            locationLatitude: position.coords.latitude,
            locationLongitude: position.coords.longitude,
            manualLocation: "", // Clear manual location when GPS is used
          }));
          setEditGpsDetecting(false);
          setEditGpsError(null);
          toast({
            title: t('emergency.gps.success', 'Location Detected'),
            description: t('emergency.gps.success_desc', 'Your GPS location has been detected successfully'),
          });
        },
        (error) => {
          setEditGpsDetecting(false);
          setEditGpsError(t('emergency.gps.error', 'Unable to detect location. Please check your location permissions.'));
        }
      );
    } else {
      setEditGpsError(t('emergency.gps.not_supported', 'Geolocation is not supported by this browser'));
    }
  };

  // Handle edit form submission
  const handleEditSubmit = () => {
    editRequestMutation.mutate(editFormData);
  };

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
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-red-900 dark:text-red-100">{t('clinic_results.emergency_request', 'Emergency Request')}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenEditDialog}
                      className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
                      data-testid="button-edit-request"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      {t('common.edit', 'Edit')}
                    </Button>
                  </div>
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
                  {emergencyRequest.manualLocation && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      <strong>{t('clinic_results.location', 'Location')}:</strong> {emergencyRequest.manualLocation}
                    </p>
                  )}
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    <strong>{t('clinic_results.contact', 'Contact')}:</strong> {emergencyRequest.contactPhone}
                    {emergencyRequest.contactName && ` (${emergencyRequest.contactName})`}
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
                    <h3 className="text-xl font-bold mb-1">🚨 {t('emergency.instant_broadcast_title', 'INSTANT EMERGENCY BROADCAST')}</h3>
                    <p className="text-sm text-red-50">
                      {t('emergency.instant_broadcast_desc', 'Send alert to {count} available 24-hour support {plural} NOW')
                        .replace('{count}', String(supportHospitals24h.length))
                        .replace('{plural}', supportHospitals24h.length === 1 ? 'hospital' : 'hospitals')}
                    </p>
                    <p className="text-xs text-red-100 mt-2">
                      ⚡ {t('emergency.instant_broadcast_tip', 'Fastest way to get help - One click to reach all partner hospitals')}
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
                      {t('common.sending', 'Sending...')}
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      {t('emergency.instant_broadcast_button', 'BROADCAST NOW')}
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
                  className={`hover:shadow-lg transition-all border-l-4 border-l-red-600 ${isSelected ? 'ring-2 ring-orange-500' : ''} ${isExistingPatient ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''}`}
                  data-testid={`card-clinic-${clinic.id}`}
                >
                  <CardHeader className="pb-3">
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
                      
                      <div className="flex-1 min-w-0">
                        {/* Existing Patient Indicator - Highest Priority */}
                        {isExistingPatient && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 mb-2 font-bold" data-testid={`badge-existing-patient-${clinic.id}`}>
                            ⭐ {t('clinic_results.existing_patient_badge', 'EXISTING PATIENT - Medical Records Available')}
                          </Badge>
                        )}
                        
                        {/* Partner Badge */}
                        {clinic.isSupportHospital && !isExistingPatient && (
                          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 mb-2 font-bold" data-testid={`badge-partner-${clinic.id}`}>
                            ⭐ PetSOS Partner
                          </Badge>
                        )}
                        
                        {/* Clinic Name - Compact */}
                        <CardTitle className="text-lg mb-1 leading-tight">
                          {language === 'zh-HK' && clinic.nameZh ? clinic.nameZh : clinic.name}
                          {language === 'zh-HK' && clinic.nameZh && (
                            <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                              {clinic.name}
                            </span>
                          )}
                        </CardTitle>
                        
                        {/* Distance Badge - Prominent */}
                        {clinic.distance !== undefined && (
                          <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-semibold mb-2" data-testid={`text-clinic-distance-${clinic.id}`}>
                            <MapPin className="h-3 w-3" />
                            {clinic.distance.toFixed(1)} km {language === 'zh-HK' ? '距離' : 'away'}
                          </div>
                        )}
                        
                        {/* Address - Single Line Truncated */}
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2" data-testid={`text-clinic-address-${clinic.id}`}>
                          {language === 'zh-HK' && clinic.addressZh ? clinic.addressZh : clinic.address}
                        </div>
                        
                        {/* Additional Badges in Compact Row */}
                        <div className="flex flex-wrap gap-1.5">
                          {clinic.whatsapp && (
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-xs">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              WhatsApp
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* 24-Hour Badge - Prominent with Brand Color */}
                      {clinic.is24Hour && (
                        <Badge className="bg-red-600 hover:bg-red-700 shrink-0" data-testid={`badge-24hour-${clinic.id}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {language === 'zh-HK' ? '24小時' : '24hrs'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Action Buttons - Compact Row */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCall(clinic.phone, clinic.id, clinic.name)}
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        data-testid={`button-call-${clinic.id}`}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {language === 'zh-HK' ? '致電' : 'Call'}
                      </Button>
                      {clinic.whatsapp && (
                        <Button
                          onClick={() => handleWhatsApp(clinic.whatsapp!, clinic.id, clinic.name)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`button-whatsapp-${clinic.id}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      {clinic.latitude && clinic.longitude && (
                        <Button
                          onClick={() => handleOpenMaps(clinic.latitude!, clinic.longitude!, clinic.name)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`button-maps-${clinic.id}`}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          {language === 'zh-HK' ? '導航' : 'Maps'}
                        </Button>
                      )}
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
                    {buildStructuredBroadcastMessage(emergencyRequest, t, allClinics)}
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

      {/* Edit Emergency Request Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'zh-HK' ? '編輯緊急求助資料' : 'Edit Emergency Request'}
            </DialogTitle>
            <DialogDescription>
              {language === 'zh-HK' 
                ? '更新您的緊急求助資料。變更將反映在未來的廣播訊息中。'
                : 'Update your emergency request details. Changes will be reflected in future broadcasts.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Contact Name */}
            <div>
              <Label htmlFor="edit-contact-name">
                {language === 'zh-HK' ? '聯絡人姓名' : 'Contact Name'}
              </Label>
              <Input
                id="edit-contact-name"
                value={editFormData.contactName}
                onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                placeholder={t('emergency.name_placeholder', 'Your name')}
                data-testid="input-edit-contact-name"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <Label htmlFor="edit-contact-phone">
                {language === 'zh-HK' ? '聯絡電話' : 'Contact Phone'}
              </Label>
              <Input
                id="edit-contact-phone"
                value={editFormData.contactPhone}
                onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                placeholder={t('emergency.phone_placeholder', '+852 1234 5678')}
                data-testid="input-edit-contact-phone"
              />
            </div>

            {/* Symptoms - Bilingual */}
            <div>
              <Label htmlFor="edit-symptom" className="text-gray-700 dark:text-gray-300">
                {language === 'zh-HK' ? '症狀' : 'Symptoms'}
              </Label>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {editFormData.symptom}
              </div>
            </div>

            {/* Location - with GPS */}
            <div>
              <Label htmlFor="edit-location" className="text-gray-700 dark:text-gray-300">
                {language === 'zh-HK' ? '位置' : 'Location'}
              </Label>
              
              {/* GPS Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2 mb-2"
                onClick={handleEditUseGps}
                disabled={editGpsDetecting}
                data-testid="button-use-gps"
              >
                {editGpsDetecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {language === 'zh-HK' ? '偵測位置中...' : 'Detecting location...'}
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    {language === 'zh-HK' ? '使用 GPS 定位' : 'Use GPS Location'}
                  </>
                )}
              </Button>
              
              {/* GPS Status */}
              {editFormData.locationLatitude && editFormData.locationLongitude && (
                <div className="text-xs text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {language === 'zh-HK' 
                    ? `GPS 位置已偵測: ${editFormData.locationLatitude.toFixed(6)}, ${editFormData.locationLongitude.toFixed(6)}`
                    : `GPS location detected: ${editFormData.locationLatitude.toFixed(6)}, ${editFormData.locationLongitude.toFixed(6)}`
                  }
                </div>
              )}
              
              {/* GPS Error */}
              {editGpsError && (
                <div className="text-xs text-red-600 dark:text-red-400 mb-2">
                  {editGpsError}
                </div>
              )}
              
              {/* Manual Location Input */}
              <Input
                id="edit-location"
                value={editFormData.manualLocation}
                onChange={(e) => setEditFormData({ ...editFormData, manualLocation: e.target.value })}
                placeholder={language === 'zh-HK' ? '地區或地址' : 'Area or address'}
                data-testid="input-edit-location"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {language === 'zh-HK' 
                  ? '使用 GPS 或手動輸入地址'
                  : 'Use GPS or manually enter address'
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              data-testid="button-cancel-edit"
            >
              {language === 'zh-HK' ? '取消' : 'Cancel'}
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editRequestMutation.isPending}
              data-testid="button-save-edit"
            >
              {editRequestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'zh-HK' ? '儲存變更' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
