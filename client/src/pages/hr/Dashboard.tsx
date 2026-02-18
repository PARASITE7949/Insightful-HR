import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/apiClient";
import { generateAllAppraisals } from "@/lib/ai-scoring";
import { Users, FileText, TrendingUp, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "react-router-dom";
import { HolidayAnnouncements } from "@/components/HolidayAnnouncements";

export default function HRDashboard() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [companyUsers, setCompanyUsers] = useState<any[]>([]);
    const [appraisals, setAppraisals] = useState<any[]>([]);
  
  if (!user) return null;

  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const [usersRes, appraisalsRes, attendanceRes] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getCompanyAppraisals(),
          apiClient.getCompanyAttendance(today),
        ]);
        
        if (usersRes.success && Array.isArray(usersRes.data)) {
          setCompanyUsers(usersRes.data);
        }
        
        if (appraisalsRes.success && Array.isArray(appraisalsRes.data)) {
          setAppraisals(appraisalsRes.data);
        }

        if (attendanceRes.success && Array.isArray(attendanceRes.data)) {
          setTodayAttendance(attendanceRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch HR dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    // Auto-refresh every 60 seconds for live updates (reduced frequency to avoid rate limits)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [user.id]);

  const employees = companyUsers.filter(u => u.role === "employee");
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const pendingAppraisals = appraisals.filter(a => a.status === "pending");
  const presentToday = todayAttendance.filter((a: any) => a.status === "present" || a.status === "late").length;

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

  const handleGenerateReports = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    generateAllAppraisals(user.companyId, currentMonth, currentYear);
    setIsGenerating(false);
    toast.success("Performance reports generated for all employees!");
    window.location.reload();
  };

  const avgPerformance = appraisals.length > 0
    ? Math.round(appraisals.reduce((sum, a) => sum + (a.overallScore || 0), 0) / appraisals.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">HR Dashboard</h1>
            <p className="text-muted-foreground">Overview of employee performance and appraisals (Live Updates)</p>
          </div>
          <Button onClick={handleGenerateReports} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Generate Monthly Reports"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{presentToday}/{employees.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {employees.length > 0 ? Math.round((presentToday / employees.length) * 100) : 0}% attendance rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingAppraisals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting HR review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgPerformance}%</div>
              <p className="text-xs text-muted-foreground mt-1">Company average</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pending Appraisals</CardTitle>
              <CardDescription>Employee reports awaiting your review</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAppraisals.length > 0 ? (
                <div className="space-y-3">
                  {pendingAppraisals.slice(0, 5).map((appraisal) => (
                    <div key={appraisal._id || appraisal.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{appraisal.employeeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appraisal.month} {appraisal.year} • {appraisal.department}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{appraisal.overallScore || 0}%</Badge>
                        <Link to="/hr/appraisals">
                          <Button size="sm" variant="outline">Review</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No pending appraisals</p>
                  <p className="text-sm">Generate reports to create new appraisals</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Overview</CardTitle>
              <CardDescription>Quick view of all employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.slice(0, 5).map((employee) => {
                  const empAppraisal = appraisals.find(a => (a.userId === employee.id || a.userId === employee._id));
                  return (
                    <div key={employee.id || employee._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {employee.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                      <Badge variant={empAppraisal ? "default" : "secondary"}>
                        {empAppraisal ? `${empAppraisal.overallScore || 0}%` : "No data"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              <Link to="/hr/employees">
                <Button variant="outline" className="w-full mt-4">View All Employees</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department Statistics</CardTitle>
            <CardDescription>Performance breakdown by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {["Engineering", "Marketing", "Sales"].map((dept) => {
                const deptEmployees = employees.filter(e => e.department === dept);
                const deptAppraisals = appraisals.filter(a => a.department === dept);
                const avgScore = deptAppraisals.length > 0
                  ? Math.round(deptAppraisals.reduce((sum, a) => sum + (a.overallScore || 0), 0) / deptAppraisals.length)
                  : 0;
                
                return (
                  <div key={dept} className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium">{dept}</h4>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold">{avgScore}%</p>
                        <p className="text-sm text-muted-foreground">avg. score</p>
                      </div>
                      <Badge variant="secondary">{deptEmployees.length} employees</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <HolidayAnnouncements />
      </div>
    </DashboardLayout>
  );
}
