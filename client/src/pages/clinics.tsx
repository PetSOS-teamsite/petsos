import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Search, Phone, MessageCircle, MapPin, Clock, Navigation, ExternalLink } from "lucide-react";
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

type Clinic = {
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
  latitude: number | null;
  longitude: number | null;
  status: string;
  services: string[];
};

type Region = {
  id: string;
  code: string;
  nameEn: string;
  nameZh: string;
};

export default function ClinicsPage() {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [show24HourOnly, setShow24HourOnly] = useState(true); // Default to 24-hour only
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: clinics, isLoading: clinicsLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

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

  const filteredClinics = clinics?.filter((clinic) => {
    const matchesSearch =
      !searchQuery ||
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.nameZh?.includes(searchQuery) ||
      clinic.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.addressZh?.includes(searchQuery);

    const matchesRegion = selectedRegion === "all" || clinic.regionId === selectedRegion;
    
    const matches24Hour = !show24HourOnly || clinic.is24Hour;

    return matchesSearch && matchesRegion && matches24Hour && clinic.status === "active";
  })
  // Sort by distance if user location is available
  ?.sort((a, b) => {
    if (!userLocation) return 0;
    
    const distanceA = a.latitude && a.longitude 
      ? calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
      : Infinity;
    const distanceB = b.latitude && b.longitude
      ? calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
      : Infinity;
    
    return distanceA - distanceB;
  });

  // Track clinic search when filters change
  useEffect(() => {
    if (filteredClinics && (searchQuery || selectedRegion !== "all" || show24HourOnly)) {
      analytics.trackClinicSearch({
        region: selectedRegion !== "all" ? selectedRegion : undefined,
        is24Hour: show24HourOnly || undefined,
        resultsCount: filteredClinics.length,
      });
    }
  }, [searchQuery, selectedRegion, show24HourOnly, filteredClinics?.length]);

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

  const handleCardClick = (clinic: Clinic, e: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    // Search Google for clinic name and address - usually shows Google Business page
    const searchQuery = `${clinic.name} ${clinic.address}`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(googleSearchUrl, "_blank");
  };

  return (
    <>
      <SEO
        title={language === 'zh-HK'
          ? "24小時獸醫診所目錄 - PetSOS | GPS距離顯示"
          : "24-Hour Veterinary Clinics Directory - PetSOS | GPS Distance Tracking"
        }
        description={language === 'zh-HK'
          ? "搜尋香港24小時動物醫院。GPS自動顯示距離，按最近診所排序。覆蓋港島、九龍、新界所有地區。一鍵致電或WhatsApp聯絡，毛孩緊急情況最快找到協助。"
          : "Search 24-hour animal hospitals in Hong Kong. GPS-powered distance tracking, sorted by nearest clinics. Coverage across Hong Kong Island, Kowloon, and New Territories. One-tap call or WhatsApp contact for fast emergency help."
        }
        keywords={language === 'zh-HK'
          ? "24小時獸醫, 動物醫院目錄, GPS尋找診所, 最近獸醫, 香港島, 九龍, 新界, WhatsApp聯絡"
          : "24-hour vet directory, animal hospital finder, GPS clinic search, nearest vet, Hong Kong Island, Kowloon, New Territories, WhatsApp contact"
        }
        canonical="https://petsos.site/clinics"
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
                {t("clinics.title", "Veterinary Clinics")}
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
              placeholder={t("clinics.search", "Search clinics by name or address...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              data-testid="input-search"
            />
          </div>

          {/* Region Filter Tabs */}
          {regionsLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <Tabs value={selectedRegion} onValueChange={setSelectedRegion}>
              <TabsList className="grid w-full grid-cols-4" data-testid="tabs-region">
                <TabsTrigger value="all" data-testid="tab-all">
                  {language === 'zh-HK' ? '全港' : 'All HK'}
                </TabsTrigger>
                {regions?.map((region) => (
                  <TabsTrigger
                    key={region.id}
                    value={region.id}
                    data-testid={`tab-region-${region.code}`}
                  >
                    {language === 'zh-HK' ? region.nameZh : region.nameEn}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* 24 Hour Filter - Brand Styled */}
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <Switch
              id="24hour-filter"
              checked={show24HourOnly}
              onCheckedChange={setShow24HourOnly}
              data-testid="switch-24hour-filter"
              className="data-[state=checked]:bg-red-600"
            />
            <Label
              htmlFor="24hour-filter"
              className="flex items-center gap-2 cursor-pointer text-sm font-medium text-red-900 dark:text-red-100"
            >
              <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
              {language === 'zh-HK' ? '只顯示24小時診所' : 'Show 24-Hour Clinics Only'}
            </Label>
          </div>

          {/* Location Status Banner - Compact */}
          {locationError ? (
            <div className="p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg" data-testid="banner-location-error">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                <p className="text-xs text-yellow-900 dark:text-yellow-100">
                  {language === 'zh-HK' ? '無法取得位置 - 請啟用定位以顯示距離' : 'Location unavailable - Enable GPS to see distances'}
                </p>
              </div>
            </div>
          ) : userLocation ? (
            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" data-testid="banner-location-success">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-xs text-red-900 dark:text-red-100 font-medium">
                  {language === 'zh-HK' ? '📍 已按距離排序 - 最近的診所優先顯示' : '📍 Sorted by distance - Nearest clinics first'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" data-testid="banner-location-loading">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500 animate-pulse" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {language === 'zh-HK' ? '正在取得位置...' : 'Getting your location...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {clinicsLoading ? (
          <div className="max-w-4xl mx-auto mb-4">
            <Skeleton className="h-6 w-40" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto mb-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm" data-testid="text-results-count">
              {language === 'zh-HK' 
                ? `已找到 ${filteredClinics?.length || 0} 間診所`
                : `${filteredClinics?.length || 0} ${filteredClinics?.length !== 1 ? 'clinics' : 'clinic'} found`
              }
            </p>
          </div>
        )}

        {/* Clinic List */}
        <div className="max-w-4xl mx-auto space-y-3">
          {clinicsLoading ? (
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
          ) : filteredClinics && filteredClinics.length > 0 ? (
            filteredClinics.map((clinic) => (
              <Card
                key={clinic.id}
                className="group hover:shadow-lg hover:border-l-red-700 transition-all border-l-4 border-l-red-600 cursor-pointer"
                onClick={(e) => handleCardClick(clinic, e)}
                data-testid={`card-clinic-${clinic.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Clinic Name - Compact */}
                      <CardTitle className="text-lg mb-1 leading-tight">
                        <span className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors" data-testid={`text-clinic-name-${clinic.id}`}>
                          {language === 'zh-HK' && clinic.nameZh ? clinic.nameZh : clinic.name}
                          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-red-600 flex-shrink-0" />
                        </span>
                        {language === 'zh-HK' && clinic.nameZh && (
                          <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                            {clinic.name}
                          </span>
                        )}
                      </CardTitle>
                      
                      {/* Distance Badge - Prominent */}
                      {userLocation && clinic.latitude && clinic.longitude && (
                        <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-semibold mb-2" data-testid={`text-clinic-distance-${clinic.id}`}>
                          <MapPin className="h-3 w-3" />
                          {calculateDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude).toFixed(1)} km {language === 'zh-HK' ? '距離' : 'away'}
                        </div>
                      )}
                      
                      {/* Address - Single Line Truncated */}
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate" data-testid={`text-clinic-address-${clinic.id}`}>
                        {language === 'zh-HK' && clinic.addressZh ? clinic.addressZh : clinic.address}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(clinic.phone);
                      }}
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      data-testid={`button-call-${clinic.id}`}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {language === 'zh-HK' ? '致電' : 'Call'}
                    </Button>
                    {clinic.whatsapp && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsApp(clinic.whatsapp!);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMaps(clinic.latitude!, clinic.longitude!, clinic.name);
                        }}
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
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2" data-testid="text-no-results">
                  {t("clinics.no_results", "No clinics found matching your criteria")}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  {t("clinics.adjust_search", "Try adjusting your search or filters")}
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
