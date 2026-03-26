import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import apiClient from "@/lib/apiClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { TrendingUp, Award, Target, Brain, CheckCircle, AlertCircle, RefreshCw, Clock } from "lucide-react";

interface PerformanceMetrics {
  attendanceScore: number;
  punctualityScore: number;
  taskCompletionScore: number;
  projectScore: number;
  overallScore: number;
  aiAnalysis: string;
  strengths: string[];
  areasForImprovement: string[];
}

function generateAIAnalysis(metrics: {
  attendanceScore: number;
  punctualityScore: number;
  taskCompletionScore: number;
  projectScore: number;
  overallScore: number;
}): {
  analysis: string;
  strengths: string[];
  areasForImprovement: string[];
} {
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  
  if (metrics.attendanceScore >= 95) {
    strengths.push("Excellent attendance record showing strong commitment");
  } else if (metrics.attendanceScore >= 85) {
    strengths.push("Good attendance maintained throughout the period");
  } else if (metrics.attendanceScore < 80) {
    areasForImprovement.push("Attendance needs improvement - consider addressing any underlying issues");
  }
  
  if (metrics.punctualityScore >= 90) {
    strengths.push("Consistently punctual, demonstrating professionalism");
  } else if (metrics.punctualityScore < 75) {
    areasForImprovement.push("Punctuality requires attention - arriving on time is crucial");
  }
  
  if (metrics.taskCompletionScore >= 90) {
    strengths.push("Outstanding task completion rate with high efficiency");
  } else if (metrics.taskCompletionScore >= 75) {
    strengths.push("Reliable task completion maintaining good productivity");
  } else {
    areasForImprovement.push("Task completion rate could be improved with better time management");
  }
  
  if (metrics.projectScore >= 85) {
    strengths.push("Excellent project delivery meeting deadlines consistently");
  } else if (metrics.projectScore < 70) {
    areasForImprovement.push("Project deadlines often missed - consider workload management");
  }
  
  let analysis = "";
  if (metrics.overallScore >= 90) {
    analysis = "Exceptional performance this period. You have demonstrated outstanding commitment, efficiency, and professionalism across all measured parameters. Keep up the excellent work!";
  } else if (metrics.overallScore >= 80) {
    analysis = "Strong performance with consistent results across most areas. You show dedication and reliability. Minor improvements in some areas would elevate your performance to exceptional levels.";
  } else if (metrics.overallScore >= 70) {
    analysis = "Satisfactory performance meeting basic expectations. There are clear opportunities for growth and improvement. Focused development in identified areas will help you excel.";
  } else if (metrics.overallScore >= 60) {
    analysis = "Performance is below expectations in several areas. Immediate attention and a performance improvement plan are recommended. Consider seeking guidance or additional training.";
  } else {
    analysis = "Significant performance concerns requiring immediate intervention. A comprehensive review and action plan should be developed. Focus on improving attendance and task completion first.";
  }
  
  return { analysis, strengths, areasForImprovement };
}

async function calculatePerformanceFromAPI(
  userId: string,
  companyId: string,
  month: number,
  year: number
): Promise<PerformanceMetrics> {
  const monthStr = (month + 1).toString().padStart(2, "0");
  const yearStr = year.toString();
  
  // Fetch attendance and tasks for the selected month/year
  const [attendanceRes, tasksRes] = await Promise.all([
    apiClient.getAttendance(userId, monthStr, yearStr),
    apiClient.getTasks(userId),
  ]);

  const attendance = attendanceRes.success && Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
  const allTasks = tasksRes.success && Array.isArray(tasksRes.data) ? tasksRes.data : [];

  // Filter tasks for the selected month/year
  const tasks = allTasks.filter((task: any) => {
    if (!task.createdAt) return false;
    const taskDate = new Date(task.createdAt);
    return taskDate.getMonth() === month && taskDate.getFullYear() === year;
  });

  // Calculate Attendance Score
  const attendanceScore = attendance.length > 0
    ? Math.round(
        ((attendance.filter((r: any) => r.status === "present" || r.status === "late").length /
          attendance.length) *
          100)
      )
    : 0;

  // Calculate Punctuality Score
  const presentRecords = attendance.filter((r: any) => r.status === "present" || r.status === "late");
  const punctualityScore = presentRecords.length > 0
    ? Math.round((attendance.filter((r: any) => r.status === "present").length / presentRecords.length) * 100)
    : 0;

  // Calculate Task Completion Score
  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const taskCompletionScore = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0; // Default if no tasks

  // Calculate Project Delivery Score
  const completedTaskList = tasks.filter((t: any) => t.status === "completed");
  const onTimeCompletions = completedTaskList.filter((task: any) => {
    if (!task.completedAt || !task.dueDate) return false;
    return new Date(task.completedAt) <= new Date(task.dueDate);
  }).length;

  const projectScore = completedTaskList.length > 0
    ? Math.round((onTimeCompletions / completedTaskList.length) * 100)
    : 0; // Default if no completed tasks

  // Calculate Overall Score (weighted average)
  const overallScore = Math.round(
    attendanceScore * 0.25 +
    punctualityScore * 0.25 +
    taskCompletionScore * 0.30 +
    projectScore * 0.20
  );

  // Generate AI Analysis
  const { analysis, strengths, areasForImprovement } = generateAIAnalysis({
    attendanceScore,
    punctualityScore,
    taskCompletionScore,
    projectScore,
    overallScore,
  });

  return {
    attendanceScore,
    punctualityScore,
    taskCompletionScore,
    projectScore,
    overallScore,
    aiAnalysis: analysis,
    strengths,
    areasForImprovement,
  };
}

export default function EmployeePerformance() {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async (showRefreshing = false) => {
      if (!user) return;
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const [metricsData, appraisalsRes] = await Promise.all([
          calculatePerformanceFromAPI(user.id, user.companyId, selectedMonth, selectedYear),
          apiClient.getAppraisalsByUser(user.id),
        ]);
        
        setMetrics(metricsData);
        setLastUpdated(new Date());
        
        if (appraisalsRes.success && Array.isArray(appraisalsRes.data)) {
          setAppraisals(appraisalsRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch performance data", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    // Immediately fetch when component mounts or month/year changes
    fetchData();
    
    // Auto-refresh every 30 seconds for live activity updates
    // This ensures metrics update as employees check in/out, complete tasks, etc.
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [user, selectedMonth, selectedYear]);

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const [metricsData, appraisalsRes] = await Promise.all([
        calculatePerformanceFromAPI(user.id, user.companyId, selectedMonth, selectedYear),
        apiClient.getAppraisalsByUser(user.id),
      ]);
      
      setMetrics(metricsData);
      setLastUpdated(new Date());
      
      if (appraisalsRes.success && Array.isArray(appraisalsRes.data)) {
        setAppraisals(appraisalsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch performance data", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  if (!user) return null;

  if (isLoading || !metrics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading performance metrics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"];

  const barChartData = [
    { name: "Attendance", score: metrics.attendanceScore, fill: "hsl(var(--chart-1))" },
    { name: "Punctuality", score: metrics.punctualityScore, fill: "hsl(var(--chart-2))" },
    { name: "Tasks", score: metrics.taskCompletionScore, fill: "hsl(var(--chart-3))" },
    { name: "Projects", score: metrics.projectScore, fill: "hsl(var(--chart-4))" },
  ];

  const radarData = [
    { metric: "Attendance", value: metrics.attendanceScore, fullMark: 100 },
    { metric: "Punctuality", value: metrics.punctualityScore, fullMark: 100 },
    { metric: "Task Completion", value: metrics.taskCompletionScore, fullMark: 100 },
    { metric: "Project Delivery", value: metrics.projectScore, fullMark: 100 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-primary";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Exceptional";
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 60) return "Satisfactory";
    return "Needs Improvement";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Performance</h1>
              {isRefreshing && (
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              )}
            </div>
            <p className="text-muted-foreground">
              View your AI-analyzed performance metrics based on actual activity (Live Updates Every 30s)
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshing...
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => {
                setSelectedMonth(parseInt(v));
                // useEffect will automatically trigger refresh when month changes
              }}
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
              onValueChange={(v) => {
                setSelectedYear(parseInt(v));
                // useEffect will automatically trigger refresh when year changes
              }}
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

        <Card className="overflow-hidden">
          <div className="gradient-primary p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Overall Performance Score</p>
                <h2 className="text-5xl font-bold mt-2">{metrics.overallScore}%</h2>
                <p className="mt-2 text-lg">{getScoreLabel(metrics.overallScore)}</p>
              </div>
              <div className="h-24 w-24 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Award className="h-12 w-12" />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(metrics.attendanceScore)}`}>
                {metrics.attendanceScore}%
              </div>
              <Progress value={metrics.attendanceScore} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Punctuality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(metrics.punctualityScore)}`}>
                {metrics.punctualityScore}%
              </div>
              <Progress value={metrics.punctualityScore} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Task Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(metrics.taskCompletionScore)}`}>
                {metrics.taskCompletionScore}%
              </div>
              <Progress value={metrics.taskCompletionScore} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Project Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(metrics.projectScore)}`}>
                {metrics.projectScore}%
              </div>
              <Progress value={metrics.projectScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Breakdown
              </CardTitle>
              <CardDescription>Score comparison across metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, "Score"]}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Skills Radar
              </CardTitle>
              <CardDescription>Overall capability assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Performance Analysis
            </CardTitle>
            <CardDescription>
              Intelligent insights generated by our AI evaluation system based on your actual activity data for {monthNames[selectedMonth]} {selectedYear}. Metrics update automatically every 30 seconds as you check in, complete tasks, and update attendance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">{metrics.aiAnalysis}</p>
            
            <div className="grid gap-6 md:grid-cols-2">
              {metrics.strengths.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-2">
                    {metrics.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-success font-bold mt-0.5">✓</span>
                        <span className="text-muted-foreground">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {metrics.areasForImprovement.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {metrics.areasForImprovement.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-warning font-bold mt-0.5">!</span>
                        <span className="text-muted-foreground">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!isLoading && appraisals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Appraisal History</CardTitle>
              <CardDescription>Your past performance reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appraisals.map((appraisal) => (
                  <div key={appraisal._id || appraisal.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{appraisal.month} {appraisal.year}</p>
                      <p className="text-sm text-muted-foreground">Score: {appraisal.overallScore || 0}%</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          appraisal.status === "approved" ? "default" :
                          appraisal.status === "reviewed" ? "secondary" :
                          appraisal.status === "rejected" ? "destructive" : "outline"
                        }>
                          {appraisal.status}
                        </Badge>
                        {appraisal.finalRating && (
                          <Badge variant="outline">{appraisal.finalRating}</Badge>
                        )}
                      </div>
                      
                      {/* Reward Details */}
                      <div className="flex flex-wrap justify-end gap-1 mt-1">
                        {appraisal.bonusRecommended && appraisal.bonusAmount > 0 && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                            Bonus: ₹{appraisal.bonusAmount.toLocaleString()}
                          </Badge>
                        )}
                        {appraisal.incrementPercentage > 0 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            +{appraisal.incrementPercentage}% Increment
                          </Badge>
                        )}
                        {appraisal.promotionRecommended && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 font-bold">
                            Promotion Recommended!
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
