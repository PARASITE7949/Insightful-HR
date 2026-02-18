import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/apiClient";
import { Users, Building2, Settings, Shield, Activity, CheckCircle2, XCircle, Clock, Mail, Phone, User as UserIcon, Building2 as Dept } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { HolidayAnnouncements } from "@/components/HolidayAnnouncements";

interface PendingUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  position: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [usersResponse, pendingResponse] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getPendingApprovals()
        ]);

        if (usersResponse.success && Array.isArray(usersResponse.data)) {
          setCompanyUsers(usersResponse.data);
          const pending = usersResponse.data.filter(u => !u.approvedByAdmin && u.role !== "admin_staff").length;
          setPendingCount(pending);
        }

        if (pendingResponse.success && pendingResponse.data?.users) {
          setPendingUsers(pendingResponse.data.users);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // Auto-refresh every 60 seconds for live updates (reduced frequency to avoid rate limits)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const response = await apiClient.approveUser(userId);
      if (response.success) {
        toast.success("User approved successfully");
        setPendingUsers(pendingUsers.filter(u => u._id !== userId));
        setPendingCount(Math.max(0, pendingCount - 1));
      } else {
        toast.error(response.message || "Failed to approve user");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve user");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setProcessingId(userId);
    try {
      const response = await apiClient.rejectUser(userId, reason);
      if (response.success) {
        toast.success("User rejected successfully");
        setPendingUsers(pendingUsers.filter(u => u._id !== userId));
        setPendingCount(Math.max(0, pendingCount - 1));
      } else {
        toast.error(response.message || "Failed to reject user");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reject user");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const employees = companyUsers.filter(u => u.role === "employee").length;
  const hrUsers = companyUsers.filter(u => u.role === "hr_manager").length;
  const admins = companyUsers.filter(u => u.role === "admin_staff").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management (Live Updates)</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{companyUsers.length}</div>
              <p className="text-xs text-muted-foreground">{companyUsers.filter(u => u.role === "employee").length} employees, {companyUsers.filter(u => u.role === "hr_manager").length} HR, {companyUsers.filter(u => u.role === "admin_staff").length} admins</p>
            </CardContent>
          </Card>
          <Card className={pendingCount > 0 ? "cursor-pointer hover:shadow-lg transition-shadow border-orange-200 bg-orange-50/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Activity className={`h-4 w-4 ${pendingCount > 0 ? "text-orange-600 animate-pulse" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${pendingCount > 0 ? "text-orange-600" : ""}`}>{pendingCount}</div>
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-xs mt-2"
                onClick={() => navigate("/admin/pending-approvals")}
              >
                View & Approve →
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Company</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">Active Company</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-success">Operational</div>
              <p className="text-xs text-muted-foreground">All systems running</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {pendingCount > 0 && (
              <button 
                onClick={() => navigate("/admin/pending-approvals")}
                className="p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors text-center border-2 border-orange-200 shadow-sm"
              >
                <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="font-medium text-sm">Pending Approvals</p>
                <p className="text-xs text-orange-600 font-semibold">{pendingCount} pending</p>
              </button>
            )}
            <a href="/admin/users" className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Manage Users</p>
            </a>
            <a href="/admin/settings" className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Settings</p>
            </a>
            <a href="/admin/security" className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Security</p>
            </a>
            <a href="/admin/reports" className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Reports</p>
            </a>
          </CardContent>
        </Card>

        {pendingUsers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Pending User Approvals
                </h2>
                <p className="text-sm text-muted-foreground">{pendingUsers.length} user{pendingUsers.length !== 1 ? "s" : ""} awaiting approval</p>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/pending-approvals")}
              >
                View All →
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingUsers.slice(0, 6).map((pendingUser) => (
                <Card key={pendingUser._id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {pendingUser.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <CardTitle className="text-base">{pendingUser.name}</CardTitle>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground truncate">{pendingUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{pendingUser.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium capitalize">{pendingUser.role.replace(/_/g, " ")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dept className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{pendingUser.department}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      {format(new Date(pendingUser.createdAt), "MMM d, yyyy")}
                    </div>
                  </CardContent>
                  <div className="border-t mt-4 pt-3 flex gap-2">
                    <Button
                      onClick={() => handleApprove(pendingUser._id)}
                      disabled={processingId === pendingUser._id}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {processingId === pendingUser._id ? "..." : "Approve"}
                    </Button>
                    <Button
                      onClick={() => handleReject(pendingUser._id)}
                      disabled={processingId === pendingUser._id}
                      size="sm"
                      variant="destructive"
                      className="flex-1 text-xs"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      {processingId === pendingUser._id ? "..." : "Reject"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <HolidayAnnouncements />
      </div>
    </DashboardLayout>
  );
}
