import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/lib/apiClient";
import { Clock, CheckCircle, AlertCircle, Send, MessageSquare, LogOut } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DailyReport() {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<any>(null);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const [perfRes, reportRes] = await Promise.all([
          apiClient.getRealTimePerformance(user.id, today),
          apiClient.getDailyReport(user.id, today),
        ]);

        if (perfRes.success) {
          setPerformance(perfRes.data);
        }
        if (reportRes.success) {
          setDailyReport(reportRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Refresh every 60 seconds (reduced frequency to avoid rate limits)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSubmitReport = async (isHalfDay: boolean = false) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await apiClient.generateDailyReport(user.id, today, isHalfDay);
      if (response.success) {
        toast.success(isHalfDay
          ? "Half-day report submitted! You have been checked out."
          : "Daily report submitted! Managers and HR have been notified.");
        setDailyReport(response.data);
      } else {
        toast.error(response.message || "Failed to submit report");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading performance data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isHalfDay = performance?.attendanceStatus === "half-day";
  const canSubmit = performance && (performance.workingHours >= 8 || isHalfDay) && dailyReport?.status !== "submitted";
  const canSubmitHalfDay = performance && performance.workingHours < 8 && !isHalfDay && dailyReport?.status !== "submitted";

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "default" as const, icon: CheckCircle };
    if (score >= 70) return { label: "Good", variant: "secondary" as const, icon: CheckCircle };
    if (score >= 50) return { label: "Average", variant: "outline" as const, icon: AlertCircle };
    return { label: "Needs Improvement", variant: "destructive" as const, icon: AlertCircle };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Daily Report</h1>
          <p className="text-muted-foreground">Real-time performance tracking and daily submission</p>
        </div>

        {/* Real-time Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{performance?.attendanceScore || 0}%</span>
                <Badge variant={getPerformanceBadge(performance?.attendanceScore || 0).variant}>
                  {performance?.labels?.attendance || "N/A"}
                </Badge>
              </div>
              <Progress value={performance?.attendanceScore || 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Punctuality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{performance?.punctualityScore || 0}%</span>
                <Badge variant={getPerformanceBadge(performance?.punctualityScore || 0).variant}>
                  {performance?.labels?.punctuality || "N/A"}
                </Badge>
              </div>
              <Progress value={performance?.punctualityScore || 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{performance?.taskCompletionScore || 0}%</span>
                <Badge variant={getPerformanceBadge(performance?.taskCompletionScore || 0).variant}>
                  {performance?.labels?.taskCompletion || "N/A"}
                </Badge>
              </div>
              <Progress value={performance?.taskCompletionScore || 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Project Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{performance?.projectDeliveryScore || 0}%</span>
                <Badge variant={getPerformanceBadge(performance?.projectDeliveryScore || 0).variant}>
                  {performance?.labels?.projectDelivery || "N/A"}
                </Badge>
              </div>
              <Progress value={performance?.projectDeliveryScore || 0} />
            </CardContent>
          </Card>
        </div>

        {/* Working Hours & Tasks */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Working Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{performance?.workingHours?.toFixed(1) || "0.0"}h</div>
              <p className="text-sm text-muted-foreground mt-1">
                {performance?.workingHours >= 8 ? "✓ Minimum requirement met" : `${(8 - (performance?.workingHours || 0)).toFixed(1)}h remaining`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{performance?.tasksCompleted || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {performance?.tasksPending || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{performance?.overallScore || 0}%</div>
              <Progress value={performance?.overallScore || 0} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Submit Report */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Daily Report</CardTitle>
            <CardDescription>
              Submit your daily report after completing 8 working hours (or early if taking a half day). Managers and HR will be notified via SMS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyReport?.status === "submitted" ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Report Submitted</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Submitted on {dailyReport.submittedAt ? format(new Date(dailyReport.submittedAt), "PPp") : "Today"}
                  </p>
                </div>

                {/* Replies */}
                {(dailyReport.managerReply || dailyReport.hrReply) && (
                  <div className="space-y-3">
                    {dailyReport.managerReply && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Manager Reply:</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{dailyReport.managerReply}</p>
                        {dailyReport.managerRepliedAt && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {format(new Date(dailyReport.managerRepliedAt), "PPp")}
                          </p>
                        )}
                      </div>
                    )}
                    {dailyReport.hrReply && (
                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">HR Reply:</p>
                        <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">{dailyReport.hrReply}</p>
                        {dailyReport.hrRepliedAt && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            {format(new Date(dailyReport.hrRepliedAt), "PPp")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    <strong>Current Status:</strong> {performance?.workingHours >= 8 ? "Ready to submit" : isHalfDay ? "Half Day (Ready to submit)" : "Working hours not met"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {performance?.workingHours >= 8 || isHalfDay
                      ? "You can now submit your daily report."
                      : `You need ${(8 - (performance?.workingHours || 0)).toFixed(1)} more hours for a full day.`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => handleSubmitReport(false)}
                    disabled={!canSubmit || isSubmitting}
                    className="flex-1"
                    size="lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit Full Day Report"}
                  </Button>

                  {canSubmitHalfDay && (
                    <Button
                      onClick={() => handleSubmitReport(true)}
                      disabled={isSubmitting}
                      variant="outline"
                      className="flex-1 border-orange-200 hover:bg-orange-50 hover:text-orange-900"
                      size="lg"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Submitting..." : "Submit as Half Day"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout >
  );
}
