import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Search, Phone, MessageCircle, MapPin, Stethoscope, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { analytics } from "@/lib/analytics";
import { SEO } from "@/components/SEO";
import type { Hospital } from "@shared/schema";

type Region = {
  id: string;
  code: string;
  nameEn: string;
  nameZh: string;
};

export default function HospitalsPage() {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: hospitals, isLoading: hospitalsLoading } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  // Track page view
  useEffect(() => {
    analytics.event('hospital_list_page_view', {
      event_category: 'Hospital',
      language: language,
    });
  }, [language]);

  const filteredHospitals = hospitals?.filter((hospital) => {
    const matchesSearch =
      !searchQuery ||
      hospital.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.nameZh?.includes(searchQuery) ||
      hospital.addressEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.addressZh?.includes(searchQuery);

    const matchesRegion = selectedRegion === "all" || hospital.regionId === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  const handleCall = (hospital: Hospital) => {
    if (hospital.phone) {
      analytics.event('hospital_cta_click', {
        event_category: 'Hospital',
        type: 'call',
        hospital_id: hospital.id,
        hospital_slug: hospital.slug,
      });
      window.location.href = `tel:${hospital.phone}`;
    }
  };

  const handleWhatsApp = (hospital: Hospital) => {
    if (hospital.whatsapp) {
      analytics.event('hospital_cta_click', {
        event_category: 'Hospital',
        type: 'whatsapp',
        hospital_id: hospital.id,
        hospital_slug: hospital.slug,
      });
      const cleanNumber = hospital.whatsapp.replace(/[^\d]/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  const handleMaps = (hospital: Hospital) => {
    analytics.event('hospital_cta_click', {
      event_category: 'Hospital',
      type: 'maps',
      hospital_id: hospital.id,
      hospital_slug: hospital.slug,
    });
    if (hospital.latitude && hospital.longitude) {
      const mapsUrl = `https://www.google.com/maps?q=${hospital.latitude},${hospital.longitude}`;
      window.open(mapsUrl, '_blank');
    } else {
      const addressQuery = language === 'zh-HK' ? hospital.addressZh : hospital.addressEn;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <>
      <SEO
        title={language === 'zh-HK' 
          ? "24小時動物醫院 - PetSOS" 
          : "24-Hour Animal Hospitals - PetSOS"
        }
        description={language === 'zh-HK'
          ? "香港24小時動物醫院詳細資料，包括診症費用、服務設施、ICU、CT掃描等資訊。"
          : "Detailed profiles of 24-hour animal hospitals in Hong Kong, including consultation fees, facilities, ICU, CT scan, and more."
        }
        canonical="https://petsos.site/hospitals"
        language={language}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button variant="ghost" size="icon" data-testid="button-back">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2" data-testid="text-page-title">
                    <Building2 className="h-6 w-6 text-red-500" />
                    {language === 'zh-HK' ? '24小時動物醫院' : '24-Hour Animal Hospitals'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'zh-HK' ? '詳細醫院資料及診症費用參考' : 'Detailed hospital information and consultation fees'}
                  </p>
                </div>
              </div>
              <LanguageSwitcher />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={language === 'zh-HK' ? "搜尋醫院名稱或地址..." : "Search hospital name or address..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>

              {!regionsLoading && regions && (
                <Tabs value={selectedRegion} onValueChange={setSelectedRegion} className="w-full md:w-auto">
                  <TabsList data-testid="tabs-region">
                    <TabsTrigger value="all" data-testid="tab-all">
                      {language === 'zh-HK' ? '全部' : 'All'}
                    </TabsTrigger>
                    {regions.map((region) => (
                      <TabsTrigger key={region.id} value={region.id} data-testid={`tab-${region.code}`}>
                        {language === 'zh-HK' ? region.nameZh : region.nameEn}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {hospitalsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredHospitals && filteredHospitals.length > 0 ? (
            <div className="space-y-4">
              {filteredHospitals.map((hospital) => (
                <Card key={hospital.id} className="hover:shadow-lg transition-shadow" data-testid={`card-hospital-${hospital.slug}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1" data-testid={`text-hospital-name-${hospital.slug}`}>
                          {language === 'zh-HK' ? hospital.nameZh : hospital.nameEn}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span data-testid={`text-hospital-address-${hospital.slug}`}>
                            {language === 'zh-HK' ? hospital.addressZh : hospital.addressEn}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {hospital.open247 && (
                            <Badge variant="default" className="bg-red-500" data-testid={`badge-24-7-${hospital.slug}`}>
                              24/7
                            </Badge>
                          )}
                          {hospital.icuLevel && (
                            <Badge variant="outline" data-testid={`badge-icu-${hospital.slug}`}>
                              <Stethoscope className="h-3 w-3 mr-1" />
                              ICU
                            </Badge>
                          )}
                          {hospital.imagingCT && (
                            <Badge variant="outline" data-testid={`badge-ct-${hospital.slug}`}>
                              CT
                            </Badge>
                          )}
                          {hospital.parking && (
                            <Badge variant="outline" data-testid={`badge-parking-${hospital.slug}`}>
                              {language === 'zh-HK' ? '停車場' : 'Parking'}
                            </Badge>
                          )}
                          {hospital.wheelchairAccess && (
                            <Badge variant="outline" data-testid={`badge-wheelchair-${hospital.slug}`}>
                              ♿
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/hospitals/${hospital.slug}`}>
                        <Button variant="default" size="sm" data-testid={`button-view-${hospital.slug}`}>
                          {language === 'zh-HK' ? '查看詳情' : 'View Details'}
                        </Button>
                      </Link>
                      {hospital.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCall(hospital)}
                          data-testid={`button-call-${hospital.slug}`}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          {language === 'zh-HK' ? '致電' : 'Call'}
                        </Button>
                      )}
                      {hospital.whatsapp && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWhatsApp(hospital)}
                          className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                          data-testid={`button-whatsapp-${hospital.slug}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMaps(hospital)}
                        data-testid={`button-maps-${hospital.slug}`}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        {language === 'zh-HK' ? '地圖' : 'Maps'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400" data-testid="text-no-results">
                  {language === 'zh-HK' ? '未找到符合條件的醫院' : 'No hospitals found matching your criteria'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
