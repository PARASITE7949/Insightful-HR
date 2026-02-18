import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/lib/apiClient";
import { Clock, ListTodo, TrendingUp, Calendar, CheckCircle, AlertCircle } from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  
  if (!user) return null;

  const [attendance, setAttendance] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [attendanceRes, tasksRes] = await Promise.all([
          apiClient.getAttendance(user.id),
          apiClient.getTasks(user.id),
        ]);
        
        if (attendanceRes.success && Array.isArray(attendanceRes.data)) {
          setAttendance(attendanceRes.data);
        }
        
        if (tasksRes.success && Array.isArray(tasksRes.data)) {
          setTasks(tasksRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    // Auto-refresh every 60 seconds for live updates (reduced frequency to avoid rate limits)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [user.id]);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
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

  const todayAttendance = attendance.find(a => a.date === today.toISOString().split("T")[0]);
  
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const inProgressTasks = tasks.filter(t => t.status === "in-progress").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  
  const thisMonthAttendance = attendance.filter(a => {
    const date = new Date(a.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const presentDays = thisMonthAttendance.filter(a => a.status === "present" || a.status === "late").length;
  const totalWorkDays = thisMonthAttendance.length || 1;

  // Calculate real-time metrics from actual activity data
  const thisMonthTasks = tasks.filter(t => {
    if (!t.createdAt) return false;
    const taskDate = new Date(t.createdAt);
    return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
  });

  // Calculate Attendance Score
  const attendanceScore = thisMonthAttendance.length > 0
    ? Math.round((presentDays / thisMonthAttendance.length) * 100)
    : 0;

  // Calculate Punctuality Score
  const presentRecords = thisMonthAttendance.filter(r => r.status === "present" || r.status === "late");
  const punctualityScore = presentRecords.length > 0
    ? Math.round((thisMonthAttendance.filter(r => r.status === "present").length / presentRecords.length) * 100)
    : 0;

  // Calculate Task Completion Score
  const taskCompletionScore = thisMonthTasks.length > 0
    ? Math.round((thisMonthTasks.filter(t => t.status === "completed").length / thisMonthTasks.length) * 100)
    : 75; // Default if no tasks

  // Calculate Project Delivery Score
  const completedTaskList = thisMonthTasks.filter(t => t.status === "completed");
  const onTimeCompletions = completedTaskList.filter(task => {
    if (!task.completedAt || !task.dueDate) return false;
    return new Date(task.completedAt) <= new Date(task.dueDate);
  }).length;

  const projectScore = completedTaskList.length > 0
    ? Math.round((onTimeCompletions / completedTaskList.length) * 100)
    : 50; // Default if no completed tasks

  // Calculate Overall Score
  const overallScore = Math.round(
    attendanceScore * 0.25 +
    punctualityScore * 0.25 +
    taskCompletionScore * 0.30 +
    projectScore * 0.20
  );

  // Generate AI Analysis
  const generateAIAnalysis = () => {
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    
    if (attendanceScore >= 95) {
      strengths.push("Excellent attendance record showing strong commitment");
    } else if (attendanceScore < 80) {
      areasForImprovement.push("Attendance needs improvement");
    }
    
    if (punctualityScore >= 90) {
      strengths.push("Consistently punctual, demonstrating professionalism");
    } else if (punctualityScore < 75) {
      areasForImprovement.push("Punctuality requires attention");
    }
    
    if (taskCompletionScore >= 90) {
      strengths.push("Outstanding task completion rate");
    } else if (taskCompletionScore < 75) {
      areasForImprovement.push("Task completion rate could be improved");
    }
    
    if (projectScore >= 85) {
      strengths.push("Excellent project delivery meeting deadlines");
    } else if (projectScore < 70) {
      areasForImprovement.push("Project deadlines often missed");
    }
    
    let analysis = "";
    if (overallScore >= 90) {
      analysis = "Exceptional performance this month. You have demonstrated outstanding commitment, efficiency, and professionalism across all measured parameters.";
    } else if (overallScore >= 80) {
      analysis = "Strong performance with consistent results across most areas. You show dedication and reliability.";
    } else if (overallScore >= 70) {
      analysis = "Satisfactory performance meeting basic expectations. There are clear opportunities for growth and improvement.";
    } else {
      analysis = "Performance needs improvement. Focus on improving attendance and task completion.";
    }
    
    return { analysis, strengths, areasForImprovement };
  };

  const { analysis, strengths, areasForImprovement } = generateAIAnalysis();

  const metrics = {
    attendanceScore,
    punctualityScore,
    taskCompletionScore,
    projectScore,
    overallScore,
    aiAnalysis: analysis,
    strengths,
    areasForImprovement,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">Here's an overview of your performance this month (Live Updates)</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayAttendance ? (
                  <Badge variant={todayAttendance.status === "present" ? "default" : "secondary"}>
                    {todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1)}
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Marked</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayAttendance?.checkIn ? `Checked in at ${todayAttendance.checkIn}` : "Mark your attendance"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentDays}/{totalWorkDays}</div>
              <Progress value={(presentDays / totalWorkDays) * 100} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Days present this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}/{tasks.length}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">{pendingTasks} pending</Badge>
                <Badge variant="outline" className="text-xs">{inProgressTasks} active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overallScore}%</div>
              <Progress value={metrics.overallScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Overall score this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Breakdown */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Detailed breakdown of your scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Attendance</span>
                  <span className="font-medium">{metrics.attendanceScore}%</span>
                </div>
                <Progress value={metrics.attendanceScore} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Punctuality</span>
                  <span className="font-medium">{metrics.punctualityScore}%</span>
                </div>
                <Progress value={metrics.punctualityScore} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Task Completion</span>
                  <span className="font-medium">{metrics.taskCompletionScore}%</span>
                </div>
                <Progress value={metrics.taskCompletionScore} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Project Delivery</span>
                  <span className="font-medium">{metrics.projectScore}%</span>
                </div>
                <Progress value={metrics.projectScore} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>Insights from our AI evaluation system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{metrics.aiAnalysis}</p>
              
              {metrics.strengths.length > 0 && (
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {metrics.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-success mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {metrics.areasForImprovement.length > 0 && (
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-1">
                    {metrics.areasForImprovement.map((area, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-warning mt-1">•</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your latest task updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      task.status === "completed" ? "bg-success" :
                      task.status === "in-progress" ? "bg-primary" : "bg-muted-foreground"
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.project}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      task.priority === "high" ? "destructive" :
                      task.priority === "medium" ? "default" : "secondary"
                    } className="text-xs">
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
