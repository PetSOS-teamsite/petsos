import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Search, Phone, MessageCircle, MapPin, Clock, Navigation, ExternalLink, Building2 } from "lucide-react";
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
import type { Hospital } from "@shared/schema";

type Region = {
  id: string;
  code: string;
  nameEn: string;
  nameZh: string;
};

export default function AdminClinicsPage() {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [show24HourOnly, setShow24HourOnly] = useState(true); // Default to 24-hour only
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: hospitals, isLoading: hospitalsLoading } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  // Filter only available hospitals
  const allProviders = useMemo<Hospital[]>(() => {
    return hospitals?.filter(hospital => hospital.isAvailable === true) || [];
  }, [hospitals]);

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

  const filteredHospitals = allProviders?.filter((hospital) => {
    const matchesSearch =
      !searchQuery ||
      hospital.nameEn?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      hospital.nameZh?.includes(searchQuery) ||
      hospital.addressEn?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      hospital.addressZh?.includes(searchQuery);

    const matchesRegion = selectedRegion === "all" || hospital.regionId === selectedRegion;
    
    // Only filter by 24-hour status if the toggle is enabled
    const matches24Hour = !show24HourOnly || hospital.open247 === true;

    return matchesSearch && matchesRegion && matches24Hour;
  })
  // Sort by partner status first, then by distance
  ?.sort((a, b) => {
    // Partner hospitals always come first
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

  // Track hospital search when filters change
  useEffect(() => {
    if (filteredHospitals && (searchQuery || selectedRegion !== "all" || show24HourOnly)) {
      analytics.trackClinicSearch({
        region: selectedRegion !== "all" ? selectedRegion : undefined,
        is24Hour: show24HourOnly || undefined,
        resultsCount: filteredHospitals.length,
      });
    }
  }, [searchQuery, selectedRegion, show24HourOnly, filteredHospitals?.length]);

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

  const handleCardClick = (hospital: Hospital, e: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    // Navigate to hospital detail page (with null check)
    if (hospital.slug) {
      window.location.href = `/hospitals/${hospital.slug}`;
    }
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
        language={language}
      />
      <StructuredData data={createVeterinaryDirectorySchema(language)} id="schema-veterinary-directory" />
      <StructuredData 
        data={createBreadcrumbSchema([
          { name: language === 'zh-HK' ? "主頁" : "Home", url: "https://petsos.site/" },
          { name: language === 'zh-HK' ? "診所目錄" : "Clinics", url: "https://petsos.site/clinics" }
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

          {/* 24 Hour Filter - Brand Styled */}
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <Switch
              id="24hour-filter"
              checked={show24HourOnly}
              onCheckedChange={(value) => {
                console.log('[24h Filter] Switch toggled:', value);
                setShow24HourOnly(value);
              }}
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
                  {language === 'zh-HK' ? '📍 已按距離排序 - 最近的診所優先顯示' : '📍 Sorted by distance - Nearest clinics first'}
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
        {hospitalsLoading ? (
          <div className="max-w-4xl mx-auto mb-4">
            <Skeleton className="h-6 w-40" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto mb-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm" data-testid="text-results-count">
              {language === 'zh-HK' 
                ? `已找到 ${filteredHospitals?.length || 0} 間診所`
                : `${filteredHospitals?.length || 0} ${filteredHospitals?.length !== 1 ? 'hospitals' : 'hospital'} found`
              }
            </p>
          </div>
        )}

        {/* Hospital List */}
        <div className="max-w-4xl mx-auto space-y-3">
          {hospitalsLoading ? (
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
          ) : filteredHospitals && filteredHospitals.length > 0 ? (
            filteredHospitals.map((hospital) => (
              <Card
                key={hospital.id}
                className="group hover:shadow-lg hover:border-l-red-700 transition-all border-l-4 border-l-red-600 cursor-pointer"
                onClick={(e) => handleCardClick(hospital, e)}
                data-testid={`card-clinic-${hospital.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {/* Partner Badge */}
                        {hospital.isPartner && (
                          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 font-bold" data-testid={`badge-partner-${hospital.id}`}>
                            ⭐ PetSOS Partner
                          </Badge>
                        )}
                        
                        {/* Hospital Badge */}
                        <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 font-bold" data-testid={`badge-hospital-${hospital.id}`}>
                          <Building2 className="h-3 w-3 mr-1" />
                          {hospital.open247 
                            ? (language === 'zh-HK' ? '24小時動物醫院' : '24-Hour Hospital')
                            : (language === 'zh-HK' ? '動物醫院' : 'Animal Hospital')
                          }
                        </Badge>
                      </div>
                      
                      {/* Hospital Name - Compact */}
                      <CardTitle className="text-lg mb-1 leading-tight">
                        <span className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors" data-testid={`text-clinic-name-${hospital.id}`}>
                          {language === 'zh-HK' && hospital.nameZh ? hospital.nameZh : hospital.nameEn}
                          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-red-600 flex-shrink-0" />
                        </span>
                        {language === 'zh-HK' && hospital.nameZh && (
                          <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                            {hospital.nameEn}
                          </span>
                        )}
                      </CardTitle>
                      
                      {/* Distance Badge - Prominent */}
                      {userLocation && hospital.latitude && hospital.longitude && (
                        <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-semibold mb-2" data-testid={`text-clinic-distance-${hospital.id}`}>
                          <MapPin className="h-3 w-3" />
                          {calculateDistance(userLocation.lat, userLocation.lng, parseFloat(hospital.latitude), parseFloat(hospital.longitude)).toFixed(1)} km {language === 'zh-HK' ? '距離' : 'away'}
                        </div>
                      )}
                      
                      {/* Address - Single Line Truncated */}
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate" data-testid={`text-clinic-address-${hospital.id}`}>
                        {language === 'zh-HK' && hospital.addressZh ? hospital.addressZh : hospital.addressEn}
                      </div>
                    </div>
                    
                    {/* 24-Hour Badge - Prominent with Brand Color */}
                    {hospital.open247 && (
                      <Badge className="bg-red-600 hover:bg-red-700 shrink-0" data-testid={`badge-24hour-${hospital.id}`}>
                        <Clock className="h-3 w-3 mr-1" />
                        {language === 'zh-HK' ? '24小時' : '24hrs'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Action Buttons - Compact Row */}
                  <div className="flex gap-2">
                    {hospital.phone && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(hospital.phone!);
                        }}
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        data-testid={`button-call-${hospital.id}`}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {language === 'zh-HK' ? '致電' : 'Call'}
                      </Button>
                    )}
                    {hospital.whatsapp && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsApp(hospital.whatsapp!);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        data-testid={`button-whatsapp-${hospital.id}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                    {hospital.latitude && hospital.longitude && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMaps(parseFloat(hospital.latitude!), parseFloat(hospital.longitude!), hospital.nameEn);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        data-testid={`button-maps-${hospital.id}`}
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
