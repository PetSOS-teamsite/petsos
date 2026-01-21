import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, History, Filter, RefreshCw, Building2, Clock, User, FileText } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dateFormat";
import type { Hospital, HospitalChangeLog } from "@shared/schema";

export default function AdminHospitalAuditPage() {
  const [limit, setLimit] = useState(100);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading, refetch } = useQuery<HospitalChangeLog[]>({
    queryKey: [`/api/admin/hospital-change-logs?limit=${limit}`],
  });

  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const hospitalMap = new Map(hospitals?.map(h => [h.id, h]) || []);

  const filteredLogs = logs?.filter(log => {
    if (filterSource !== "all" && log.changeSource !== filterSource) return false;
    if (filterType !== "all" && log.changeType !== filterType) return false;
    if (searchTerm) {
      const hospital = hospitalMap.get(log.hospitalId);
      const hospitalName = hospital?.nameEn?.toLowerCase() || '';
      const fieldName = log.fieldName?.toLowerCase() || '';
      const changedBy = log.changedBy?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();
      if (!hospitalName.includes(term) && !fieldName.includes(term) && !changedBy.includes(term)) {
        return false;
      }
    }
    return true;
  }) || [];

  const getSourceBadge = (source: string | null) => {
    switch (source) {
      case 'access_code':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Access Code</Badge>;
      case 'verification_code':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Verification Code</Badge>;
      case 'admin':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Admin</Badge>;
      case 'api':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">API</Badge>;
      default:
        return <Badge variant="outline">{source || 'Unknown'}</Badge>;
    }
  };

  const getTypeBadge = (type: string | null) => {
    switch (type) {
      case 'update':
        return <Badge className="bg-green-100 text-green-700">Update</Badge>;
      case 'confirm':
        return <Badge className="bg-blue-100 text-blue-700">Confirm</Badge>;
      case 'status_change':
        return <Badge className="bg-orange-100 text-orange-700">Status</Badge>;
      default:
        return <Badge variant="secondary">{type || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO
        title="Hospital Audit Trail | PetSOS Admin"
        description="View detailed change history for all hospital updates"
      />

      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/hospitals">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="h-6 w-6" />
                  Hospital Audit Trail
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track all changes made to hospital information
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <Input
                  placeholder="Hospital name, field, or person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Change Source</label>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger data-testid="select-source">
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="access_code">Access Code</SelectItem>
                    <SelectItem value="verification_code">Verification Code</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Change Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="confirm">Confirm</SelectItem>
                    <SelectItem value="status_change">Status Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Show</label>
                <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                  <SelectTrigger data-testid="select-limit">
                    <SelectValue placeholder="100 records" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 records</SelectItem>
                    <SelectItem value="100">100 records</SelectItem>
                    <SelectItem value="250">250 records</SelectItem>
                    <SelectItem value="500">500 records</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Change History
              </CardTitle>
              <Badge variant="secondary">{filteredLogs.length} records</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No change logs found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Old Value</TableHead>
                      <TableHead>New Value</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const hospital = hospitalMap.get(log.hospitalId);
                      return (
                        <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {log.createdAt ? formatDate(log.createdAt) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-gray-400" />
                              <span className="font-medium text-sm">
                                {hospital?.nameEn || log.hospitalId.slice(0, 8)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                              {log.fieldName}
                            </code>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-sm text-gray-600">
                            {log.oldValue || <span className="text-gray-400 italic">empty</span>}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-sm">
                            {log.newValue || <span className="text-gray-400 italic">empty</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-gray-400" />
                              {log.changedBy || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>{getSourceBadge(log.changeSource)}</TableCell>
                          <TableCell>{getTypeBadge(log.changeType)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
