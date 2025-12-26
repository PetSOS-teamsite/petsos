import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  CloudRain, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone, 
  MapPin,
  Bell,
  Calendar,
  RefreshCw
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData, createEmergencyStatusSchema } from "@/components/StructuredData";
import type { Hospital, TyphoonAlert, HospitalEmergencyStatus, HkHoliday } from "@shared/schema";

interface TyphoonStatusData {
  currentAlert: TyphoonAlert | null;
  upcomingHoliday: HkHoliday | null;
  hospitalStatuses: (HospitalEmergencyStatus & { hospital: Hospital })[];
  lastUpdated: string;
}

const TYPHOON_SIGNAL_INFO = {
  T1: { colorEn: 'Standby', colorZh: '戒備', level: 1, bgColor: 'bg-green-100 dark:bg-green-900/20', textColor: 'text-green-800 dark:text-green-200' },
  T3: { colorEn: 'Strong Wind', colorZh: '強風', level: 3, bgColor: 'bg-yellow-100 dark:bg-yellow-900/20', textColor: 'text-yellow-800 dark:text-yellow-200' },
  T8NW: { colorEn: 'Gale/Storm NW', colorZh: '烈風或暴風（西北）', level: 8, bgColor: 'bg-orange-100 dark:bg-orange-900/20', textColor: 'text-orange-800 dark:text-orange-200' },
  T8NE: { colorEn: 'Gale/Storm NE', colorZh: '烈風或暴風（東北）', level: 8, bgColor: 'bg-orange-100 dark:bg-orange-900/20', textColor: 'text-orange-800 dark:text-orange-200' },
  T8SW: { colorEn: 'Gale/Storm SW', colorZh: '烈風或暴風（西南）', level: 8, bgColor: 'bg-orange-100 dark:bg-orange-900/20', textColor: 'text-orange-800 dark:text-orange-200' },
  T8SE: { colorEn: 'Gale/Storm SE', colorZh: '烈風或暴風（東南）', level: 8, bgColor: 'bg-orange-100 dark:bg-orange-900/20', textColor: 'text-orange-800 dark:text-orange-200' },
  T9: { colorEn: 'Increasing Gale', colorZh: '烈風或暴風風力增強', level: 9, bgColor: 'bg-red-100 dark:bg-red-900/20', textColor: 'text-red-800 dark:text-red-200' },
  T10: { colorEn: 'Hurricane', colorZh: '颶風', level: 10, bgColor: 'bg-purple-100 dark:bg-purple-900/20', textColor: 'text-purple-800 dark:text-purple-200' },
};

export default function TyphoonStatusPage() {
  const { language } = useLanguage();

  const { data: statusData, isLoading, refetch, isFetching } = useQuery<TyphoonStatusData>({
    queryKey: ['/api/typhoon/status'],
    refetchInterval: 60000,
  });

  const { data: allHospitals } = useQuery<Hospital[]>({
    queryKey: ['/api/hospitals'],
  });

  const currentSignal = statusData?.currentAlert?.signalCode as keyof typeof TYPHOON_SIGNAL_INFO | undefined;
  const signalInfo = currentSignal ? TYPHOON_SIGNAL_INFO[currentSignal] : null;

  const confirmedOpen = statusData?.hospitalStatuses?.filter(s => s.isOpen) || [];
  const confirmedClosed = statusData?.hospitalStatuses?.filter(s => !s.isOpen) || [];
  const unconfirmed = allHospitals?.filter(h => 
    !statusData?.hospitalStatuses?.some(s => s.hospitalId === h.id)
  ) || [];

  const createPageSchema = () => {
    if (!statusData?.currentAlert) {
      return createEmergencyStatusSchema('normal', [], language);
    }
    return createEmergencyStatusSchema(
      'typhoon',
      confirmedOpen.map(s => ({
        name: language === 'zh-HK' ? s.hospital.nameZh : s.hospital.nameEn,
        url: `https://petsos.site/hospitals/${s.hospital.slug}`
      })),
      language
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === 'zh-HK' ? 'zh-HK' : 'en-HK', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'zh-HK' ? 'zh-HK' : 'en-HK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "颱風期間24小時獸醫診所狀態 | PetSOS"
          : "24-Hour Vet Status During Typhoon | PetSOS"
        }
        description={language === 'zh-HK'
          ? "即時查看香港颱風期間24小時獸醫診所的營業狀態。確認哪些診所在T8/T10信號期間仍然開放。"
          : "Real-time status of 24-hour veterinary clinics during Hong Kong typhoons. See which clinics are confirmed open during T8/T10 signals."
        }
        keywords={language === 'zh-HK'
          ? "颱風獸醫, T8診所開放, 香港颱風寵物緊急, 24小時獸醫颱風"
          : "typhoon vet, T8 clinic open, Hong Kong typhoon pet emergency, 24-hour vet typhoon"
        }
        canonical="https://petsos.site/typhoon-status"
        language={language}
      />
      <StructuredData data={createPageSchema()} id="schema-emergency-status" />

      <header className={`border-b border-border ${signalInfo ? signalInfo.bgColor : 'bg-green-50 dark:bg-green-900/10'}`}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-4 rounded-full ${signalInfo ? 'bg-orange-600' : 'bg-green-600'}`}>
              <CloudRain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
                {language === 'zh-HK' ? '颱風/假日診所狀態' : 'Typhoon/Holiday Clinic Status'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'zh-HK' ? '即時更新24小時獸醫診所營業狀態' : 'Real-time 24-hour vet clinic availability'}
              </p>
            </div>
          </div>

          {statusData?.currentAlert ? (
            <div className={`p-4 rounded-lg ${signalInfo?.bgColor || 'bg-orange-100'} border-2 border-orange-500`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-6 w-6 ${signalInfo?.textColor || 'text-orange-800'}`} />
                <div>
                  <div className="font-bold text-lg">
                    {language === 'zh-HK' 
                      ? `🌀 ${statusData.currentAlert.signalCode} 颱風信號生效中`
                      : `🌀 ${statusData.currentAlert.signalCode} Typhoon Signal in Effect`
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'zh-HK' 
                      ? `發出時間: ${formatTime(statusData.currentAlert.issuedAt.toString())}`
                      : `Issued: ${formatTime(statusData.currentAlert.issuedAt.toString())}`
                    }
                  </div>
                </div>
              </div>
            </div>
          ) : statusData?.upcomingHoliday ? (
            <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-500">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                <div>
                  <div className="font-bold text-lg text-blue-900 dark:text-blue-100">
                    {language === 'zh-HK' 
                      ? `📅 即將來臨假期: ${statusData.upcomingHoliday.nameZh}`
                      : `📅 Upcoming Holiday: ${statusData.upcomingHoliday.nameEn}`
                    }
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {formatDate(statusData.upcomingHoliday.date.toString())}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border-2 border-green-500">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-300" />
                <div className="font-bold text-lg text-green-900 dark:text-green-100">
                  {language === 'zh-HK' ? '✅ 目前沒有颱風信號' : '✅ No Typhoon Signal Currently'}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground">
            {statusData?.lastUpdated && (
              <>
                {language === 'zh-HK' ? '最後更新: ' : 'Last updated: '}
                {formatTime(statusData.lastUpdated)}
              </>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {language === 'zh-HK' ? '刷新' : 'Refresh'}
          </Button>
        </div>

        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Bell className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                  {language === 'zh-HK' ? '訂閱颱風通知' : 'Subscribe to Typhoon Alerts'}
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  {language === 'zh-HK' 
                    ? '當T8信號發出時，收到診所營業狀態的即時通知。'
                    : 'Get instant notifications about clinic availability when T8 signal is issued.'
                  }
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-subscribe">
                  <Bell className="h-4 w-4 mr-2" />
                  {language === 'zh-HK' ? '訂閱通知' : 'Subscribe to Alerts'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <>
            {confirmedOpen.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {language === 'zh-HK' 
                    ? `確認營業 (${confirmedOpen.length})`
                    : `Confirmed Open (${confirmedOpen.length})`
                  }
                </h2>
                <div className="space-y-3">
                  {confirmedOpen.map((status) => (
                    <Card 
                      key={status.id} 
                      className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow"
                      data-testid={`card-hospital-open-${status.hospitalId}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Link href={`/hospitals/${status.hospital.slug}`}>
                              <h3 className="font-bold text-foreground hover:text-blue-600 cursor-pointer">
                                {language === 'zh-HK' ? status.hospital.nameZh : status.hospital.nameEn}
                              </h3>
                            </Link>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {language === 'zh-HK' ? status.hospital.addressZh : status.hospital.addressEn}
                            </p>
                            {status.openingTime && status.closingTime && (
                              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {status.openingTime} - {status.closingTime}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {language === 'zh-HK' 
                                ? `確認於 ${formatTime(status.confirmedAt.toString())}`
                                : `Confirmed at ${formatTime(status.confirmedAt.toString())}`
                              }
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => status.hospital.phone && (window.location.href = `tel:${status.hospital.phone}`)}
                            data-testid={`button-call-${status.hospitalId}`}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            {language === 'zh-HK' ? '致電' : 'Call'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {confirmedClosed.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  {language === 'zh-HK' 
                    ? `確認暫停營業 (${confirmedClosed.length})`
                    : `Confirmed Closed (${confirmedClosed.length})`
                  }
                </h2>
                <div className="space-y-3">
                  {confirmedClosed.map((status) => (
                    <Card 
                      key={status.id} 
                      className="border-l-4 border-l-red-500 opacity-75"
                      data-testid={`card-hospital-closed-${status.hospitalId}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-foreground">
                              {language === 'zh-HK' ? status.hospital.nameZh : status.hospital.nameEn}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {status.notes || (language === 'zh-HK' ? '颱風期間暫停服務' : 'Closed during typhoon')}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            {language === 'zh-HK' ? '暫停' : 'Closed'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {unconfirmed.length > 0 && statusData?.currentAlert && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  {language === 'zh-HK' 
                    ? `等待確認 (${unconfirmed.length})`
                    : `Awaiting Confirmation (${unconfirmed.length})`
                  }
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'zh-HK' 
                    ? '這些診所尚未確認颱風期間的營業狀態。建議直接致電查詢。'
                    : 'These clinics have not yet confirmed their typhoon status. We recommend calling directly.'
                  }
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unconfirmed.slice(0, 6).map((hospital) => (
                    <Card 
                      key={hospital.id} 
                      className="border-l-4 border-l-amber-500"
                      data-testid={`card-hospital-pending-${hospital.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">
                              {language === 'zh-HK' ? hospital.nameZh : hospital.nameEn}
                            </h4>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => hospital.phone && (window.location.href = `tel:${hospital.phone}`)}
                            data-testid={`button-call-pending-${hospital.id}`}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {unconfirmed.length > 6 && (
                  <div className="mt-4 text-center">
                    <Link href="/hospitals">
                      <Button variant="outline">
                        {language === 'zh-HK' 
                          ? `查看所有 ${unconfirmed.length} 間診所`
                          : `View all ${unconfirmed.length} clinics`
                        }
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!statusData?.currentAlert && !statusData?.upcomingHoliday && (
              <Card className="text-center p-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {language === 'zh-HK' ? '天氣良好' : 'Clear Weather'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {language === 'zh-HK' 
                    ? '目前沒有颱風警告。所有24小時獸醫診所按正常時間營業。'
                    : 'No typhoon warnings currently. All 24-hour veterinary clinics operating normally.'
                  }
                </p>
                <Link href="/hospitals">
                  <Button className="bg-red-600 hover:bg-red-700">
                    {language === 'zh-HK' ? '瀏覽所有診所' : 'Browse All Clinics'}
                  </Button>
                </Link>
              </Card>
            )}
          </>
        )}

        <Card className="mt-8 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-900 dark:text-amber-100">
              {language === 'zh-HK' ? '🏥 診所經營者' : '🏥 For Clinic Operators'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
              {language === 'zh-HK' 
                ? '如果您經營24小時獸醫診所，請在颱風期間更新您的營業狀態，幫助寵物主人找到開放的診所。'
                : 'If you operate a 24-hour vet clinic, please update your status during typhoons to help pet owners find open clinics.'
              }
            </p>
            <Button variant="outline" className="border-amber-600 text-amber-700" data-testid="button-update-status">
              {language === 'zh-HK' ? '更新我的診所狀態' : 'Update My Clinic Status'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
