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
  const { t } = useTranslation();
  const [, params] = useRoute("/emergency-results/:requestId");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [distanceFilter, setDistanceFilter] = useState<string>("all");
  const [only24Hour, setOnly24Hour] = useState(false);
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
      
      let locationInfo = emergencyRequest?.locationText || 'Location not provided';
      if (emergencyRequest?.locationLatitude && emergencyRequest?.locationLongitude) {
        const mapsLink = `https://www.google.com/maps?q=${emergencyRequest.locationLatitude},${emergencyRequest.locationLongitude}`;
        locationInfo = emergencyRequest.locationText 
          ? `${emergencyRequest.locationText}\nMap: ${mapsLink}`
          : `GPS: ${emergencyRequest.locationLatitude}, ${emergencyRequest.locationLongitude}\nMap: ${mapsLink}`;
      }
      
      // Build pet info string
      let petInfo = '';
      if (emergencyRequest?.petSpecies) {
        petInfo = `\nPet: ${emergencyRequest.petSpecies}`;
        if (emergencyRequest.petBreed) {
          petInfo += `, ${emergencyRequest.petBreed}`;
        }
        if (emergencyRequest.petAge) {
          petInfo += ` (${emergencyRequest.petAge} years)`;
        }
      }
      
      const message = emergencyRequest
        ? `🚨 PET EMERGENCY ALERT 🚨\n\nSymptom: ${emergencyRequest.symptom}${petInfo}\nLocation: ${locationInfo}\nContact: ${emergencyRequest.contactPhone}\n${emergencyRequest.contactEmail ? `Email: ${emergencyRequest.contactEmail}` : ''}\n\nPlease respond urgently if you can help.`
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
      setSelectedClinics(new Set());
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

  const broadcastTargetCount = selectedClinics.size > 0 
    ? selectedClinics.size 
    : filteredClinics.filter(c => c.whatsapp || c.email).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Emergency Clinic Results</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredClinics.length} {filteredClinics.length === 1 ? 'clinic' : 'clinics'} found
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" data-testid="button-home">Home</Button>
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
                  <CardTitle className="text-lg text-red-900 dark:text-red-100">Emergency Request</CardTitle>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                    <strong>Symptoms:</strong> {emergencyRequest.symptom}
                  </p>
                  {emergencyRequest.locationText && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      <strong>Location:</strong> {emergencyRequest.locationText}
                    </p>
                  )}
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    <strong>Contact:</strong> {emergencyRequest.contactPhone}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Quick Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="stat-total">
            <CardContent className="pt-6 pb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{filteredClinics.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Clinics</p>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-24hour">
            <CardContent className="pt-6 pb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{clinicsWith24Hour}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">24-Hour</p>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-whatsapp">
            <CardContent className="pt-6 pb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{clinicsWithWhatsApp}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">WhatsApp</p>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-nearby">
            <CardContent className="pt-6 pb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{clinicsWithin5km}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Within 5km</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card data-testid="card-filters">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters & Search</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clinics by name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {/* Region Filter */}
                <div>
                  <Label className="text-sm mb-2 block">Region</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger data-testid="select-region">
                      <SelectValue placeholder="All Regions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.code}>
                          {region.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Distance Filter */}
                <div>
                  <Label className="text-sm mb-2 block">Distance</Label>
                  {canUseDistanceFilter ? (
                    <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                      <SelectTrigger data-testid="select-distance">
                        <SelectValue placeholder="Any Distance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Distance</SelectItem>
                        <SelectItem value="5">Within 5 km</SelectItem>
                        <SelectItem value="10">Within 10 km</SelectItem>
                        <SelectItem value="15">Within 15 km</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>
                      <Select disabled value="all">
                        <SelectTrigger data-testid="select-distance-disabled" className="opacity-50">
                          <SelectValue placeholder="GPS Not Available" />
                        </SelectTrigger>
                      </Select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {!hasUserGPS 
                          ? "Enable GPS on Step 2 for distance filtering" 
                          : "No clinic GPS data available"}
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
                    24-Hour Only
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
                    WhatsApp Only
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
                  {selectedClinics.size} clinic{selectedClinics.size !== 1 ? 's' : ''} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllClinics}
                  data-testid="button-deselect-all"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/emergency-results/${params?.requestId}/messages`}>
              <Button
                variant="outline"
                data-testid="button-view-status"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Status
              </Button>
            </Link>
            <Button
              onClick={() => setShowBroadcastDialog(true)}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={broadcastTargetCount === 0}
              data-testid="button-broadcast"
            >
              <Send className="h-4 w-4 mr-2" />
              Broadcast {selectedClinics.size > 0 ? `(${selectedClinics.size})` : 'to All'}
            </Button>
          </div>
        </div>

        {/* Clinics List */}
        <div className="space-y-4">
          {filteredClinics.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No clinics found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Try adjusting your filters or search criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClinics.map((clinic, index) => {
              const isSelected = selectedClinics.has(clinic.id);
              const canBroadcast = !!(clinic.whatsapp || clinic.email);
              
              return (
                <Card 
                  key={clinic.id} 
                  className={`hover:shadow-lg transition-all ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
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
                        {/* Urgency Indicator */}
                        {index < 3 && clinic.is24Hour && clinic.distance !== undefined && clinic.distance < 5 && (
                          <Badge className="bg-red-600 mb-2" data-testid="badge-urgent">
                            ⚡ Priority Clinic
                          </Badge>
                        )}
                        
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
                            <Badge className="bg-green-600" data-testid={`badge-24hour-${clinic.id}`}>
                              <Clock className="h-3 w-3 mr-1" />
                              24 Hours
                            </Badge>
                          )}
                          {clinic.distance !== undefined && (
                            <Badge variant="outline" data-testid={`badge-distance-${clinic.id}`}>
                              <Navigation className="h-3 w-3 mr-1" />
                              {clinic.distance.toFixed(1)} km
                            </Badge>
                          )}
                          {clinic.whatsapp && (
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              WhatsApp
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
                          <p>{clinic.address}</p>
                          {clinic.addressZh && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{clinic.addressZh}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-3">
                        <Button
                          onClick={() => handleCall(clinic.phone)}
                          className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700"
                          data-testid={`button-call-${clinic.id}`}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        {clinic.whatsapp && (
                          <Button
                            onClick={() => handleWhatsApp(clinic.whatsapp!, clinic.name)}
                            className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700"
                            data-testid={`button-whatsapp-${clinic.id}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
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
              {selectedClinics.size > 0 ? 'Broadcast to Selected Clinics' : 'Broadcast Emergency Alert'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-4">
                  {selectedClinics.size > 0 ? (
                    <>
                      This will send your emergency alert to <strong>{broadcastTargetCount}</strong> selected {broadcastTargetCount === 1 ? 'clinic' : 'clinics'} via WhatsApp and email.
                    </>
                  ) : (
                    <>
                      This will send your emergency alert to <strong>all {broadcastTargetCount}</strong> clinics via WhatsApp and email.
                    </>
                  )}
                </p>
                
                {selectedClinics.size === 0 && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 Tip: Select specific clinics using the checkboxes to send a targeted broadcast
                    </p>
                  </div>
                )}
                
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
              Send to {broadcastTargetCount} {broadcastTargetCount === 1 ? 'Clinic' : 'Clinics'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
