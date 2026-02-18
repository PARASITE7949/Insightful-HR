import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/apiClient";
import { Shield, Search, Activity, UserCheck, Settings, Award, Lock, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const categoryIcons: Record<string, typeof Shield> = {
  auth: UserCheck,
  user: Activity,
  appraisal: Award,
  settings: Settings,
  security: Lock,
  promotion: Award,
};

const categoryColors: Record<string, string> = {
  auth: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  user: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  appraisal: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  settings: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  security: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  promotion: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export default function SecurityLogs() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, auth: 0, security: 0, today: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await apiClient.getSystemLogs(categoryFilter === "all" ? undefined : categoryFilter, 200);
      if (response.success) {
        setLogs(response.data || []);
        if (response.stats) {
          setStats(response.stats);
        }
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto-refresh every 5 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, categoryFilter, autoRefresh]);

  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter((l: any) =>
      l.action?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.resource?.toLowerCase().includes(q)
    );
  }, [logs, search]);

  const getCategoryFromAction = (action: string): string => {
    if (action.includes("LOGIN") || action.includes("LOGOUT") || action.includes("REGISTER")) return "auth";
    if (action.includes("USER")) return "user";
    if (action.includes("APPRAISAL")) return "appraisal";
    if (action.includes("SETTINGS")) return "settings";
    if (action.includes("SECURITY") || action.includes("UNAUTHORIZED")) return "security";
    if (action.includes("PROMOTION") || action.includes("BONUS")) return "promotion";
    return "user";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" /> Security & Audit Logs
            </h1>
            <p className="text-muted-foreground">Track all system activities and security events (Live)</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto: ON" : "Auto: OFF"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.auth}</p>
                  <p className="text-sm text-muted-foreground">Auth Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{stats.security}</p>
                  <p className="text-sm text-muted-foreground">Security Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.today}</p>
                  <p className="text-sm text-muted-foreground">Today's Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="user">User Management</SelectItem>
                  <SelectItem value="appraisal">Appraisals</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="promotion">Promotions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                          <p className="text-sm text-muted-foreground mt-2">Loading logs...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log: any) => {
                        const category = getCategoryFromAction(log.action);
                        const Icon = categoryIcons[category] || Activity;
                        return (
                          <TableRow key={log._id || log.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(log.timestamp || log.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={categoryColors[category] || ""}>
                                <Icon className="h-3 w-3 mr-1" />
                                {category}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-sm">{log.action}</TableCell>
                            <TableCell className="text-sm">{log.userId || "-"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                              {log.description}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No logs found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
