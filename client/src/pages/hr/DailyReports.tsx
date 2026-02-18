import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import apiClient from "@/lib/apiClient";
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function HRDailyReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyType, setReplyType] = useState<"manager" | "hr">("hr");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchReports();
    // Auto-refresh every 60 seconds (reduced frequency to avoid rate limits)
    const interval = setInterval(fetchReports, 60000);
    return () => clearInterval(interval);
  }, [filterDate, filterStatus]);

  const fetchReports = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await apiClient.getCompanyDailyReports(
        filterDate !== new Date().toISOString().split("T")[0] ? filterDate : undefined,
        filterStatus !== "all" ? filterStatus : undefined
      );
      if (response.success && Array.isArray(response.data)) {
        setReports(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
      toast.error("Failed to load daily reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = (report: any) => {
    setSelectedReport(report);
    setReplyText("");
    setReplyType(user?.role === "hr_manager" ? "hr" : "manager");
    setIsReplyDialogOpen(true);
  };

  const submitReply = async () => {
    if (!selectedReport || !replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      const response = await apiClient.replyToDailyReport(selectedReport._id || selectedReport.id, replyText, replyType);
      if (response.success) {
        toast.success("Reply sent successfully! Employee will be notified via SMS.");
        setIsReplyDialogOpen(false);
        fetchReports();
      } else {
        toast.error(response.message || "Failed to send reply");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send reply");
    }
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "default" as const };
    if (score >= 70) return { label: "Good", variant: "secondary" as const };
    if (score >= 50) return { label: "Average", variant: "outline" as const };
    return { label: "Needs Improvement", variant: "destructive" as const };
  };

  if (!user) return null;

  const pendingReports = reports.filter(r => r.status === "submitted");
  const reviewedReports = reports.filter(r => r.status === "reviewed");

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Daily Reports</h1>
            <p className="text-muted-foreground">View and reply to employee daily reports (Live)</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingReports.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{reviewedReports.length}</p>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{reports.length}</p>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Reports List */}
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground mt-2">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No daily reports found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report._id || report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.employeeName || report.userId?.name || "Employee"}</CardTitle>
                      <CardDescription>{format(new Date(report.date), "PP")}</CardDescription>
                    </div>
                    <Badge variant={report.status === "reviewed" ? "default" : report.status === "submitted" ? "secondary" : "outline"}>
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Hours:</span>
                      <span className="font-medium ml-1">{report.workingHours?.toFixed(1)}h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tasks:</span>
                      <span className="font-medium ml-1">{report.tasksCompleted}/{report.tasksCompleted + report.tasksPending}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Attendance</span>
                      <Badge variant={getPerformanceBadge(report.attendanceScore).variant} className="text-xs">
                        {report.attendanceScore}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Punctuality</span>
                      <Badge variant={getPerformanceBadge(report.punctualityScore).variant} className="text-xs">
                        {report.punctualityScore}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Tasks</span>
                      <Badge variant={getPerformanceBadge(report.taskCompletionScore).variant} className="text-xs">
                        {report.taskCompletionScore}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Projects</span>
                      <Badge variant={getPerformanceBadge(report.projectDeliveryScore).variant} className="text-xs">
                        {report.projectDeliveryScore}%
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium">Overall: {report.overallScore}%</div>
                    {report.summary && (
                      <p className="text-xs text-muted-foreground mt-1">{report.summary}</p>
                    )}
                  </div>

                  {report.managerReply && (
                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-950 text-xs">
                      <p className="font-medium text-blue-900 dark:text-blue-100">Manager:</p>
                      <p className="text-blue-800 dark:text-blue-200">{report.managerReply}</p>
                    </div>
                  )}

                  {report.hrReply && (
                    <div className="p-2 rounded bg-purple-50 dark:bg-purple-950 text-xs">
                      <p className="font-medium text-purple-900 dark:text-purple-100">HR:</p>
                      <p className="text-purple-800 dark:text-purple-200">{report.hrReply}</p>
                    </div>
                  )}

                  {report.status === "submitted" && (
                    <Button
                      onClick={() => handleReply(report)}
                      size="sm"
                      className="w-full"
                      variant="outline"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Dialog */}
        <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to Daily Report</DialogTitle>
              <DialogDescription>
                Your reply will be sent to the employee via SMS
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reply Type</Label>
                <Select value={replyType} onValueChange={(v: "manager" | "hr") => setReplyType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">As Manager</SelectItem>
                    <SelectItem value="hr">As HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Your Reply</Label>
                <Textarea
                  placeholder="Enter your reply message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitReply}>
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
