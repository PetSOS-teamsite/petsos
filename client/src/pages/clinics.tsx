import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Search, Phone, MessageCircle, MapPin, Clock, Navigation, ExternalLink, Building2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { analytics } from "@/lib/analytics";
import { SEO } from "@/components/SEO";
import { StructuredData, createVeterinaryDirectorySchema, createBreadcrumbSchema } from "@/components/StructuredData";
import type { Hospital, Clinic } from "@shared/schema";

type Region = {
  id: string;
  code: string;
  nameEn: string;
  nameZh: string;
};

// Unified provider type that can represent both hospitals and clinics
type VetProvider = {
  id: string;
  type: 'hospital' | 'clinic';
  nameEn: string;
  nameZh: string | null;
  addressEn: string;
  addressZh: string | null;
  phone: string | null;
  whatsapp: string | null;
  regionId: string | null;
  latitude: string | null;
  longitude: string | null;
  is24Hour: boolean;
  isPartner: boolean;
  isAvailable: boolean;
  slug?: string | null;
  averageRating?: string | null;
  reviewCount?: number;
};

export default function ClinicsPage() {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [showHospitals, setShowHospitals] = useState(true); // true = hospitals, false = clinics
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: hospitals, isLoading: hospitalsLoading } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const { data: clinics, isLoading: clinicsLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  // Separate provider lists for hospitals and clinics
  const hospitalProviders = useMemo<VetProvider[]>(() => {
    return hospitals?.filter(h => h.isAvailable === true).map(h => ({
      id: h.id,
      type: 'hospital' as const,
      nameEn: h.nameEn,
      nameZh: h.nameZh,
      addressEn: h.addressEn,
      addressZh: h.addressZh,
      phone: h.phone,
      whatsapp: h.whatsapp,
      regionId: h.regionId,
      latitude: h.latitude,
      longitude: h.longitude,
      is24Hour: h.open247 === true,
      isPartner: h.isPartner === true,
      isAvailable: h.isAvailable === true,
      slug: h.slug,
    })) || [];
  }, [hospitals]);

  const clinicProviders = useMemo<VetProvider[]>(() => {
    return clinics?.filter(c => c.isAvailable === true && c.status === 'active').map(c => ({
      id: c.id,
      type: 'clinic' as const,
      nameEn: c.name,
      nameZh: c.nameZh,
      addressEn: c.address,
      addressZh: c.addressZh,
      phone: c.phone,
      whatsapp: c.whatsapp,
      regionId: c.regionId,
      latitude: c.latitude,
      longitude: c.longitude,
      is24Hour: c.is24Hour === true,
      isPartner: c.isSupportHospital === true,
      isAvailable: c.isAvailable === true,
      slug: null,
      averageRating: c.averageRating,
      reviewCount: c.reviewCount ?? 0,
    })) || [];
  }, [clinics]);

  // Select which provider list to display based on toggle
  const allProviders = showHospitals ? hospitalProviders : clinicProviders;

  const isLoading = hospitalsLoading || clinicsLoading;

  // Get user's GPS location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(error.message);
        }
      );
    } else {
      setLocationError("Geolocation not supported");
    }
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredProviders = allProviders?.filter((provider) => {
    const matchesSearch =
      !searchQuery ||
      provider.nameEn?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      provider.nameZh?.includes(searchQuery) ||
      provider.addressEn?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      provider.addressZh?.includes(searchQuery);

    const matchesRegion = selectedRegion === "all" || provider.regionId === selectedRegion;

    return matchesSearch && matchesRegion;
  })
  // Sort by partner status first, then by distance
  ?.sort((a, b) => {
    // Partner providers always come first
    if (a.isPartner && !b.isPartner) return -1;
    if (!a.isPartner && b.isPartner) return 1;
    
    // Within same partner status, sort by distance if location available
    if (!userLocation) return 0;
    
    const distanceA = a.latitude && a.longitude 
      ? calculateDistance(userLocation.lat, userLocation.lng, parseFloat(a.latitude), parseFloat(a.longitude))
      : Infinity;
    const distanceB = b.latitude && b.longitude
      ? calculateDistance(userLocation.lat, userLocation.lng, parseFloat(b.latitude), parseFloat(b.longitude))
      : Infinity;
    
    return distanceA - distanceB;
  });

  // Track search when filters change
  useEffect(() => {
    if (filteredProviders && (searchQuery || selectedRegion !== "all")) {
      analytics.trackClinicSearch({
        region: selectedRegion !== "all" ? selectedRegion : undefined,
        directoryType: showHospitals ? 'hospital' : 'clinic',
        resultsCount: filteredProviders.length,
      });
    }
  }, [searchQuery, selectedRegion, showHospitals, filteredProviders?.length]);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsapp: string) => {
    window.open(`https://wa.me/${whatsapp.replace(/[^0-9+]/g, "")}`, "_blank");
  };

  const handleMaps = (latitude: number, longitude: number, name: string) => {
    // Open Google Maps with clinic location
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${encodeURIComponent(name)}`;
    window.open(mapsUrl, "_blank");
  };

  const handleCardClick = (provider: VetProvider, e: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    // Navigate to hospital detail page (only for hospitals with slug)
    if (provider.type === 'hospital' && provider.slug) {
      window.location.href = `/hospitals/${provider.slug}`;
    }
  };

  return (
    <>
      <SEO
        title={language === 'zh-HK'
          ? "動物診所目錄 - PetSOS | GPS距離顯示"
          : "Veterinary Clinics Directory - PetSOS | GPS Distance Tracking"
        }
        description={language === 'zh-HK'
          ? "搜尋香港動物診所及24小時動物醫院。GPS自動顯示距離，按最近診所排序。覆蓋港島、九龍、新界所有地區。一鍵致電或WhatsApp聯絡，毛孩緊急情況最快找到協助。"
          : "Search veterinary clinics and 24-hour animal hospitals in Hong Kong. GPS-powered distance tracking, sorted by nearest clinics. Coverage across Hong Kong Island, Kowloon, and New Territories. One-tap call or WhatsApp contact for fast emergency help."
        }
        keywords={language === 'zh-HK'
          ? "獸醫診所, 24小時獸醫, 動物醫院目錄, GPS尋找診所, 最近獸醫, 香港島, 九龍, 新界, WhatsApp聯絡"
          : "vet clinic, 24-hour vet directory, animal hospital finder, GPS clinic search, nearest vet, Hong Kong Island, Kowloon, New Territories, WhatsApp contact"
        }
        canonical="https://petsos.site/clinics"
        language={language}
      />
      <StructuredData data={createVeterinaryDirectorySchema(language)} id="schema-veterinary-directory" />
      <StructuredData 
        data={createBreadcrumbSchema([
          { name: language === 'zh-HK' ? "主頁" : "Home", url: "https://petsos.site/" },
          { name: language === 'zh-HK' ? "動物診所" : "Veterinary Clinics", url: "https://petsos.site/clinics" }
        ])} 
        id="schema-breadcrumb-clinics" 
      />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'zh-HK' ? '動物診所' : 'Veterinary Clinics'}
              </h1>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder={language === 'zh-HK' ? '搜尋動物診所名稱或地址...' : 'Search clinics by name or address...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              data-testid="input-search"
            />
          </div>

          {/* Region Filter Tabs - Scrollable on mobile */}
          {regionsLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <Tabs value={selectedRegion} onValueChange={setSelectedRegion}>
              <TabsList className="inline-flex w-full h-auto p-1 overflow-x-auto scrollbar-hide" data-testid="tabs-region">
                <TabsTrigger 
                  value="all" 
                  data-testid="tab-all"
                  className="flex-shrink-0 min-w-[80px] h-10 px-4"
                >
                  {language === 'zh-HK' ? '全港' : 'All HK'}
                </TabsTrigger>
                {regions?.map((region) => (
                  <TabsTrigger
                    key={region.id}
                    value={region.id}
                    data-testid={`tab-region-${region.code}`}
                    className="flex-shrink-0 min-w-[80px] h-10 px-4"
                  >
                    {language === 'zh-HK' ? region.nameZh : region.nameEn}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* Directory Type Toggle - Hospital vs Clinic */}
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <Switch
              id="directory-toggle"
              checked={showHospitals}
              onCheckedChange={(value) => {
                setShowHospitals(value);
              }}
              data-testid="switch-directory-toggle"
              className="data-[state=checked]:bg-red-600"
            />
            <Label
              htmlFor="directory-toggle"
              className="flex items-center gap-2 cursor-pointer text-sm font-medium text-red-900 dark:text-red-100"
            >
              {showHospitals ? (
                <>
                  <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                  {language === 'zh-HK' ? '24小時動物醫院' : '24-Hour Hospitals'}
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  {language === 'zh-HK' ? '動物診所' : 'Veterinary Clinics'}
                </>
              )}
            </Label>
          </div>

          {/* Location Status Banner - Compact */}
          {locationError ? (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg" data-testid="banner-location-error">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  {language === 'zh-HK' ? '無法取得位置 - 請啟用定位以顯示距離' : 'Location unavailable - Enable GPS to see distances'}
                </p>
              </div>
            </div>
          ) : userLocation ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" data-testid="banner-location-success">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-900 dark:text-red-100 font-medium">
                  {language === 'zh-HK' 
                    ? `📍 已按距離排序 - 最近的${showHospitals ? '醫院' : '診所'}優先顯示`
                    : `📍 Sorted by distance - Nearest ${showHospitals ? 'hospitals' : 'clinics'} first`}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" data-testid="banner-location-loading">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500 animate-pulse flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'zh-HK' ? '正在取得位置...' : 'Getting your location...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {isLoading ? (
          <div className="max-w-4xl mx-auto mb-4">
            <Skeleton className="h-6 w-40" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto mb-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm" data-testid="text-results-count">
              {language === 'zh-HK' 
                ? `已找到 ${filteredProviders?.length || 0} 間${showHospitals ? '24小時動物醫院' : '動物診所'}`
                : `${filteredProviders?.length || 0} ${showHospitals ? '24-hour hospital' : 'clinic'}${filteredProviders?.length !== 1 ? 's' : ''} found`
              }
            </p>
          </div>
        )}

        {/* Clinic List */}
        <div className="max-w-4xl mx-auto space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : filteredProviders && filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => (
              <Card
                key={provider.id}
                className={`group hover:shadow-lg transition-all border-l-4 cursor-pointer ${
                  provider.type === 'hospital' 
                    ? 'hover:border-l-red-700 border-l-red-600' 
                    : 'hover:border-l-blue-700 border-l-blue-600'
                }`}
                onClick={(e) => handleCardClick(provider, e)}
                data-testid={`card-clinic-${provider.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {/* Partner Badge */}
                        {provider.isPartner && (
                          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 font-bold" data-testid={`badge-partner-${provider.id}`}>
                            ⭐ PetSOS Partner
                          </Badge>
                        )}
                        
                        {/* Provider Type Badge */}
                        {provider.type === 'hospital' ? (
                          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 font-bold" data-testid={`badge-type-${provider.id}`}>
                            <Building2 className="h-3 w-3 mr-1" />
                            {provider.is24Hour 
                              ? (language === 'zh-HK' ? '24小時動物醫院' : '24-Hour Hospital')
                              : (language === 'zh-HK' ? '動物醫院' : 'Animal Hospital')
                            }
                          </Badge>
                        ) : (
                          <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 font-bold" data-testid={`badge-type-${provider.id}`}>
                            <Building2 className="h-3 w-3 mr-1" />
                            {provider.is24Hour 
                              ? (language === 'zh-HK' ? '24小時診所' : '24-Hour Clinic')
                              : (language === 'zh-HK' ? '動物診所' : 'Veterinary Clinic')
                            }
                          </Badge>
                        )}
                      </div>
                      
                      {/* Provider Name - Compact */}
                      <CardTitle className="text-lg mb-1 leading-tight">
                        <span className={`flex items-center gap-1.5 font-bold text-gray-900 dark:text-white transition-colors ${
                          provider.type === 'hospital' ? 'group-hover:text-red-600' : 'group-hover:text-blue-600'
                        }`} data-testid={`text-clinic-name-${provider.id}`}>
                          {language === 'zh-HK' && provider.nameZh ? provider.nameZh : provider.nameEn}
                          {provider.type === 'hospital' && provider.slug && (
                            <ExternalLink className={`h-4 w-4 text-gray-400 flex-shrink-0 ${
                              provider.type === 'hospital' ? 'group-hover:text-red-600' : 'group-hover:text-blue-600'
                            }`} />
                          )}
                        </span>
                        {language === 'zh-HK' && provider.nameZh && (
                          <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                            {provider.nameEn}
                          </span>
                        )}
                      </CardTitle>
                      
                      {/* Distance Badge - Prominent */}
                      {userLocation && provider.latitude && provider.longitude && (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${
                          provider.type === 'hospital' 
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        }`} data-testid={`text-clinic-distance-${provider.id}`}>
                          <MapPin className="h-3 w-3" />
                          {calculateDistance(userLocation.lat, userLocation.lng, parseFloat(provider.latitude), parseFloat(provider.longitude)).toFixed(1)} km {language === 'zh-HK' ? '距離' : 'away'}
                        </div>
                      )}
                      
                      {/* Address - Single Line Truncated */}
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate" data-testid={`text-clinic-address-${provider.id}`}>
                        {language === 'zh-HK' && provider.addressZh ? provider.addressZh : provider.addressEn}
                      </div>

                      {/* Star Rating Display */}
                      {provider.averageRating && Number(provider.averageRating) > 0 && (
                        <div className="flex items-center gap-1 mt-2" data-testid={`rating-display-${provider.id}`}>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${
                                  star <= Math.round(Number(provider.averageRating))
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {Number(provider.averageRating).toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({provider.reviewCount} {language === 'zh-HK' ? '評價' : provider.reviewCount === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* 24-Hour Badge - Prominent with Brand Color */}
                    {provider.is24Hour && (
                      <Badge className="bg-red-600 hover:bg-red-700 shrink-0" data-testid={`badge-24hour-${provider.id}`}>
                        <Clock className="h-3 w-3 mr-1" />
                        {language === 'zh-HK' ? '24小時' : '24hrs'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Action Buttons - Compact Row */}
                  <div className="flex gap-2">
                    {provider.phone && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(provider.phone!);
                        }}
                        size="sm"
                        className={`flex-1 ${
                          provider.type === 'hospital' 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        data-testid={`button-call-${provider.id}`}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {language === 'zh-HK' ? '致電' : 'Call'}
                      </Button>
                    )}
                    {provider.whatsapp && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsApp(provider.whatsapp!);
                        }}
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${
                          provider.type === 'hospital' 
                            ? 'border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                            : 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                        data-testid={`button-whatsapp-${provider.id}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                    {provider.latitude && provider.longitude && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMaps(parseFloat(provider.latitude!), parseFloat(provider.longitude!), provider.nameEn);
                        }}
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${
                          provider.type === 'hospital' 
                            ? 'border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                            : 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                        data-testid={`button-maps-${provider.id}`}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        {language === 'zh-HK' ? '導航' : 'Maps'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2" data-testid="text-no-results">
                  {language === 'zh-HK' ? '未找到符合條件的動物診所' : 'No clinics found matching your criteria'}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  {language === 'zh-HK' ? '請嘗試調整搜尋條件' : 'Try adjusting your search or filters'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      </div>
    </>
  );
}
