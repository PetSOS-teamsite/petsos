import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Search, Phone, MessageCircle, MapPin, Clock } from "lucide-react";
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
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [show24HourOnly, setShow24HourOnly] = useState(false);

  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: clinics, isLoading: clinicsLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

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
  });

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsapp: string) => {
    window.open(`https://wa.me/${whatsapp.replace(/[^0-9+]/g, "")}`, "_blank");
  };

  return (
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
                  {t("clinics.all_regions", "All Regions")}
                </TabsTrigger>
                {regions?.map((region) => (
                  <TabsTrigger
                    key={region.id}
                    value={region.id}
                    data-testid={`tab-region-${region.code}`}
                  >
                    {t(`clinics.${region.code.toLowerCase()}`, region.code)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* 24 Hour Filter */}
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <Switch
              id="24hour-filter"
              checked={show24HourOnly}
              onCheckedChange={setShow24HourOnly}
              data-testid="switch-24hour-filter"
            />
            <Label
              htmlFor="24hour-filter"
              className="flex items-center gap-2 cursor-pointer text-base font-medium"
            >
              <Clock className="h-5 w-5 text-green-600" />
              {t("clinics.24h_only", "Show 24-Hour Emergency Clinics Only")}
            </Label>
          </div>
        </div>

        {/* Results Count */}
        {clinicsLoading ? (
          <div className="max-w-4xl mx-auto mb-4">
            <Skeleton className="h-6 w-40" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto mb-4">
            <p className="text-gray-600 dark:text-gray-400" data-testid="text-results-count">
              {filteredClinics?.length || 0} {filteredClinics?.length !== 1 ? t("clinics.count_plural", "clinics") : t("clinics.count", "clinic")} {t("clinics.found", "found")}
            </p>
          </div>
        )}

        {/* Clinic List */}
        <div className="max-w-4xl mx-auto space-y-4">
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
                className="hover:shadow-lg transition-shadow"
                data-testid={`card-clinic-${clinic.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        <span data-testid={`text-clinic-name-${clinic.id}`}>
                          {clinic.name}
                        </span>
                        {clinic.nameZh && (
                          <span className="block text-lg font-normal text-gray-600 dark:text-gray-400 mt-1">
                            {clinic.nameZh}
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                        <div className="text-sm">
                          <p data-testid={`text-clinic-address-${clinic.id}`}>
                            {clinic.address}
                          </p>
                          {clinic.addressZh && (
                            <p className="text-gray-500 dark:text-gray-500">{clinic.addressZh}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {clinic.is24Hour && (
                      <Badge className="bg-green-600 hover:bg-green-700" data-testid={`badge-24hour-${clinic.id}`}>
                        <Clock className="h-3 w-3 mr-1" />
                        {t("results.24_hours", "24 Hours")}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleCall(clinic.phone)}
                      className="flex-1 min-w-[140px]"
                      data-testid={`button-call-${clinic.id}`}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {t("results.call", "Call")}
                    </Button>
                    {clinic.whatsapp && (
                      <Button
                        onClick={() => handleWhatsApp(clinic.whatsapp!)}
                        variant="outline"
                        className="flex-1 min-w-[140px]"
                        data-testid={`button-whatsapp-${clinic.id}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {t("results.whatsapp", "WhatsApp")}
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
  );
}
