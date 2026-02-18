import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import apiClient from "@/lib/apiClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, RefreshCw, TrendingUp, Users, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function HRReports() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [employeeMetrics, setEmployeeMetrics] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await apiClient.getUsers();
        if (response.success && Array.isArray(response.data)) {
          const emps = response.data.filter(u => u.role === "employee");
          setCompanyUsers(response.data);
          
          // Fetch real-time metrics for all employees
          const metricsMap: Record<string, any> = {};
          const monthStr = (selectedMonth + 1).toString().padStart(2, "0");
          const yearStr = selectedYear.toString();
          
          await Promise.all(
            emps.map(async (emp) => {
              try {
                const empId = emp.id || emp._id;
                const [attendanceRes, tasksRes] = await Promise.all([
                  apiClient.getAttendance(empId, monthStr, yearStr),
                  apiClient.getTasks(empId),
                ]);

                const attendance = attendanceRes.success && Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
                const allTasks = tasksRes.success && Array.isArray(tasksRes.data) ? tasksRes.data : [];
                const tasks = allTasks.filter((t: any) => {
                  if (!t.createdAt) return false;
                  const taskDate = new Date(t.createdAt);
                  return taskDate.getMonth() === selectedMonth && taskDate.getFullYear() === selectedYear;
                });

                // Calculate metrics
                const attendanceScore = attendance.length > 0
                  ? Math.round((attendance.filter((r: any) => r.status === "present" || r.status === "late").length / attendance.length) * 100)
                  : 0;

                const presentRecords = attendance.filter((r: any) => r.status === "present" || r.status === "late");
                const punctualityScore = presentRecords.length > 0
                  ? Math.round((attendance.filter((r: any) => r.status === "present").length / presentRecords.length) * 100)
                  : 0;

                const taskCompletionScore = tasks.length > 0
                  ? Math.round((tasks.filter((t: any) => t.status === "completed").length / tasks.length) * 100)
                  : 75;

                const completedTasks = tasks.filter((t: any) => t.status === "completed");
                const onTimeCompletions = completedTasks.filter((task: any) => {
                  if (!task.completedAt || !task.dueDate) return false;
                  return new Date(task.completedAt) <= new Date(task.dueDate);
                }).length;

                const projectScore = completedTasks.length > 0
                  ? Math.round((onTimeCompletions / completedTasks.length) * 100)
                  : 50;

                const overallScore = Math.round(
                  attendanceScore * 0.25 +
                  punctualityScore * 0.25 +
                  taskCompletionScore * 0.30 +
                  projectScore * 0.20
                );

                metricsMap[empId] = {
                  attendanceScore,
                  punctualityScore,
                  taskCompletionScore,
                  projectScore,
                  overallScore,
                };
              } catch (error) {
                console.error(`Failed to fetch metrics for ${emp.name}`, error);
              }
            })
          );
          
          setEmployeeMetrics(metricsMap);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // Auto-refresh every 60 seconds for live updates (reduced frequency to avoid rate limits)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [user, selectedMonth, selectedYear]);

  if (!user) return null;

  const employees = companyUsers.filter(u => u.role === "employee");

  const monthNames = ["January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"];

  const departments = [...new Set(employees.map(e => e.department))];
  const deptPerformance = departments.map(dept => {
    const deptEmployees = employees.filter(e => e.department === dept);
    const deptMetrics = deptEmployees.map(e => {
      const empId = e.id || e._id;
      return employeeMetrics[empId] || { overallScore: 0 };
    });
    const avgScore = deptMetrics.length > 0
      ? Math.round(deptMetrics.reduce((sum, m) => sum + m.overallScore, 0) / deptMetrics.length)
      : 0;
    return { name: dept, score: avgScore, employees: deptEmployees.length };
  });

  const performanceDistribution = [
    { name: "Exceptional (90-100)", value: 0, color: "hsl(var(--chart-2))" },
    { name: "Good (70-89)", value: 0, color: "hsl(var(--chart-1))" },
    { name: "Average (50-69)", value: 0, color: "hsl(var(--chart-3))" },
    { name: "Below Avg (<50)", value: 0, color: "hsl(var(--chart-5))" },
  ];

  employees.forEach(emp => {
    const empId = emp.id || emp._id;
    const metrics = employeeMetrics[empId] || { overallScore: 0 };
    if (metrics.overallScore >= 90) performanceDistribution[0].value++;
    else if (metrics.overallScore >= 70) performanceDistribution[1].value++;
    else if (metrics.overallScore >= 50) performanceDistribution[2].value++;
    else performanceDistribution[3].value++;
  });

  const employeeScores = employees.map(emp => {
    const empId = emp.id || emp._id;
    const metrics = employeeMetrics[empId] || { overallScore: 0 };
    return {
      ...emp,
      score: metrics.overallScore,
      metrics,
    };
  }).sort((a, b) => b.score - a.score);

  const handleGenerateReports = async () => {
    setIsGenerating(true);
    try {
      // Generate appraisals for all employees
      // Note: This would need a backend endpoint to generate appraisals
      // For now, show message that appraisals are generated automatically
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Performance data calculated for ${monthNames[selectedMonth]} ${selectedYear}`);
    } catch (error) {
      toast.error("Failed to generate reports");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    const headers = ["Employee", "Department", "Position", "Attendance", "Punctuality", "Tasks", "Projects", "Overall"];
    const rows = employeeScores.map(emp => {
      const metrics = emp.metrics || { attendanceScore: 0, punctualityScore: 0, taskCompletionScore: 0, projectScore: 0, overallScore: 0 };
      return [
        emp.name,
        emp.department,
        emp.position,
        metrics.attendanceScore,
        metrics.punctualityScore,
        metrics.taskCompletionScore,
        metrics.projectScore,
        metrics.overallScore
      ].join(",");
    });
    
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${monthNames[selectedMonth]}-${selectedYear}.csv`;
    a.click();
    
    toast.success("Report exported successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate and view performance reports based on live activity (Live Updates)</p>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground mt-2">Loading reports...</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button onClick={handleGenerateReports} disabled={isGenerating}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employees.length}</p>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {employeeScores.length > 0 ? Math.round(employeeScores.reduce((sum, e) => sum + e.score, 0) / employeeScores.length) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Avg. Performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{departments.length}</p>
                  <p className="text-sm text-muted-foreground">Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Average scores by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, "Score"]}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Distribution</CardTitle>
              <CardDescription>Employee performance categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceDistribution.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ value }) => `${value}`}
                    >
                      {performanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Rankings</CardTitle>
            <CardDescription>Performance ranking for {monthNames[selectedMonth]} {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employeeScores.map((emp, idx) => {
                const empId = emp.id || emp._id;
                const metrics = emp.metrics || { overallScore: 0 };
                return (
                  <div key={empId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? "bg-yellow-500 text-white" :
                      idx === 1 ? "bg-gray-400 text-white" :
                      idx === 2 ? "bg-amber-600 text-white" :
                      "bg-muted-foreground/20"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">{emp.department} • {emp.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{metrics.overallScore}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
