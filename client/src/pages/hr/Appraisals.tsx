import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import apiClient from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { AppraisalReport } from "@/types";
import { FileText, CheckCircle, XCircle, Clock, Eye, Brain, Award, DollarSign, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";

export default function HRAppraisals() {
  const { user } = useAuth();
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppraisal, setSelectedAppraisal] = useState<any | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isGeneratingMonthly, setIsGeneratingMonthly] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateData, setGenerateData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [reviewData, setReviewData] = useState({
    comments: "",
    rating: "" as any,
    promotionRecommended: false,
    bonusRecommended: false,
    bonusAmount: "",
    incrementPercentage: "",
  });

  useEffect(() => {
    const fetchAppraisals = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await apiClient.getCompanyAppraisals();
        if (response.success && Array.isArray(response.data)) {
          setAppraisals(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch appraisals", error);
        toast.error("Failed to load appraisals");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppraisals();
    // Auto-refresh every 60 seconds for live updates (reduced frequency to avoid rate limits)
    const interval = setInterval(fetchAppraisals, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const refreshAppraisals = async () => {
    if (!user) return;
    try {
      const response = await apiClient.getCompanyAppraisals();
      if (response.success && Array.isArray(response.data)) {
        setAppraisals(response.data);
      }
    } catch (error) {
      console.error("Failed to refresh appraisals", error);
    }
  };

  const handleGenerateMonthly = async () => {
    setIsGeneratingMonthly(true);
    try {
      const response = await apiClient.generateMonthlyAppraisals(generateData.month, generateData.year);
      if (response.success) {
        toast.success(
          `Generated ${response.data.generated} appraisals and sent ${response.data.smsNotifications} SMS notifications!`
        );
        setShowGenerateDialog(false);
        refreshAppraisals();
      } else {
        toast.error(response.message || "Failed to generate monthly appraisals");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate monthly appraisals");
    } finally {
      setIsGeneratingMonthly(false);
    }
  };

  const pendingAppraisals = appraisals.filter(a => a.status === "pending");
  const reviewedAppraisals = appraisals.filter(a => a.status === "reviewed");
  const approvedAppraisals = appraisals.filter(a => a.status === "approved");
  const rejectedAppraisals = appraisals.filter(a => a.status === "rejected");

  const handleReview = (appraisal: any) => {
    setSelectedAppraisal(appraisal);
    setReviewData({
      comments: appraisal.hrComments || "",
      rating: appraisal.finalRating || "",
      promotionRecommended: false,
      bonusRecommended: false,
      bonusAmount: "",
      incrementPercentage: "",
    });
    setIsReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedAppraisal || !user) return;

    try {
      // Update appraisal via API
      const response = await apiClient.updateAppraisal(selectedAppraisal._id || selectedAppraisal.id, {
        status: "approved",
        hrComments: reviewData.comments,
        finalRating: reviewData.rating,
      });

      if (response.success) {
        toast.success("Appraisal approved!");
        setIsReviewDialogOpen(false);
        refreshAppraisals();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to approve appraisal");
    }
  };

  const handleReject = async () => {
    if (!selectedAppraisal || !user) return;

    try {
      const response = await apiClient.updateAppraisal(selectedAppraisal._id || selectedAppraisal.id, {
        status: "rejected",
        hrComments: reviewData.comments,
      });

      if (response.success) {
        toast.success("Appraisal marked for revision");
        setIsReviewDialogOpen(false);
        refreshAppraisals();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reject appraisal");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading appraisals...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const AppraisalCard = ({ appraisal }: { appraisal: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {appraisal.employeeName.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <h4 className="font-semibold">{appraisal.employeeName}</h4>
              <p className="text-sm text-muted-foreground">{appraisal.department}</p>
              <p className="text-xs text-muted-foreground">{appraisal.month} {appraisal.year}</p>
            </div>
          </div>
          <Badge variant={
            appraisal.status === "approved" ? "default" :
              appraisal.status === "rejected" ? "destructive" :
                appraisal.status === "reviewed" ? "secondary" : "outline"
          }>
            {appraisal.status}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Score</span>
            <span className="font-bold">{appraisal.overallScore || 0}%</span>
          </div>
          <Progress value={appraisal.overallScore || 0} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Attendance</span>
            <span>{appraisal.attendanceScore || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Punctuality</span>
            <span>{appraisal.punctualityScore || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tasks</span>
            <span>{appraisal.taskCompletionScore || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Projects</span>
            <span>{appraisal.projectScore || 0}%</span>
          </div>
        </div>

        <Button
          className="w-full mt-4"
          variant="outline"
          onClick={() => handleReview(appraisal)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {appraisal.status === "pending" ? "Review" : "View Details"}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Appraisals</h1>
          <p className="text-muted-foreground">Review and manage employee performance appraisals</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{pendingAppraisals.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{reviewedAppraisals.length}</p>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{approvedAppraisals.length}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{rejectedAppraisals.length}</p>
                  <p className="text-sm text-muted-foreground">Needs Revision</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Monthly Appraisals Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <CardTitle>Generate Monthly Appraisals</CardTitle>
                  <CardDescription>Create appraisals for all employees and send SMS notifications</CardDescription>
                </div>
              </div>
              <Button
                onClick={() => setShowGenerateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Generate Now
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Appraisal Tabs */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingAppraisals.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedAppraisals.length})</TabsTrigger>
            <TabsTrigger value="rejected">Needs Revision ({rejectedAppraisals.length})</TabsTrigger>
            <TabsTrigger value="all">All ({appraisals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pendingAppraisals.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingAppraisals.map((appraisal) => (
                  <AppraisalCard key={appraisal.id} appraisal={appraisal} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No pending appraisals</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {approvedAppraisals.map((appraisal) => (
                <AppraisalCard key={appraisal.id} appraisal={appraisal} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rejectedAppraisals.map((appraisal) => (
                <AppraisalCard key={appraisal.id} appraisal={appraisal} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {appraisals.map((appraisal) => (
                <AppraisalCard key={appraisal.id} appraisal={appraisal} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Appraisal Review</DialogTitle>
              <DialogDescription>
                Review performance report for {selectedAppraisal?.employeeName}
              </DialogDescription>
            </DialogHeader>

            {selectedAppraisal && (
              <div className="space-y-6">
                {/* Employee Info */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold">
                    {selectedAppraisal.employeeName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedAppraisal.employeeName}</h3>
                    <p className="text-muted-foreground">{selectedAppraisal.department}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppraisal.month} {selectedAppraisal.year}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-4xl font-bold">{selectedAppraisal.overallScore || 0}%</p>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Performance Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Attendance</span>
                          <span>{selectedAppraisal.attendanceScore || 0}%</span>
                        </div>
                        <Progress value={selectedAppraisal.attendanceScore || 0} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Punctuality</span>
                          <span>{selectedAppraisal.punctualityScore || 0}%</span>
                        </div>
                        <Progress value={selectedAppraisal.punctualityScore || 0} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Task Completion</span>
                          <span>{selectedAppraisal.taskCompletionScore || 0}%</span>
                        </div>
                        <Progress value={selectedAppraisal.taskCompletionScore || 0} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Project Delivery</span>
                          <span>{selectedAppraisal.projectScore || 0}%</span>
                        </div>
                        <Progress value={selectedAppraisal.projectScore || 0} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {selectedAppraisal.aiAnalysis || "No analysis available"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* HR Review Section */}
                {selectedAppraisal.status === "pending" && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold">Your Review</h4>
                    <div className="space-y-2">
                      <Label>Final Rating</Label>
                      <Select
                        value={reviewData.rating}
                        onValueChange={(v: AppraisalReport["finalRating"]) =>
                          setReviewData({ ...reviewData, rating: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exceptional">Exceptional</SelectItem>
                          <SelectItem value="exceeds-expectations">Exceeds Expectations</SelectItem>
                          <SelectItem value="meets-expectations">Meets Expectations</SelectItem>
                          <SelectItem value="needs-improvement">Needs Improvement</SelectItem>
                          <SelectItem value="unsatisfactory">Unsatisfactory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Comments</Label>
                      <Textarea
                        placeholder="Add your review comments..."
                        value={reviewData.comments}
                        onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                        rows={3}
                      />
                    </div>

                    {/* Promotion & Bonus Section */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4" /> Rewards & Recognition
                      </h4>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <Label>Recommend Promotion</Label>
                        </div>
                        <Switch
                          checked={reviewData.promotionRecommended}
                          onCheckedChange={(v) => setReviewData({ ...reviewData, promotionRecommended: v })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <Label>Recommend Bonus</Label>
                        </div>
                        <Switch
                          checked={reviewData.bonusRecommended}
                          onCheckedChange={(v) => setReviewData({ ...reviewData, bonusRecommended: v })}
                        />
                      </div>

                      {reviewData.bonusRecommended && (
                        <div className="space-y-2 pl-6">
                          <Label>Bonus Amount</Label>
                          <Input
                            type="number"
                            placeholder="Enter bonus amount"
                            value={reviewData.bonusAmount}
                            onChange={(e) => setReviewData({ ...reviewData, bonusAmount: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Salary Increment (%)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 10"
                          value={reviewData.incrementPercentage}
                          onChange={(e) => setReviewData({ ...reviewData, incrementPercentage: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Previous Review Info */}
                {selectedAppraisal.hrComments && (
                  <div className="p-4 rounded-lg bg-muted/50 text-sm">
                    <p className="text-muted-foreground">{selectedAppraisal.hrComments}</p>
                    {selectedAppraisal.finalRating && (
                      <Badge className="mt-2">Rating: {selectedAppraisal.finalRating}</Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                Close
              </Button>
              {selectedAppraisal?.status === "pending" && (
                <>
                  <Button variant="destructive" onClick={handleReject}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Request Revision
                  </Button>
                  <Button onClick={handleApprove}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate Monthly Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Monthly Appraisals</DialogTitle>
              <DialogDescription>
                This will create appraisals for all employees based on their attendance and task completion data, and send SMS notifications.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Select value={generateData.month.toString()} onValueChange={(value) => setGenerateData({ ...generateData, month: parseInt(value) })}>
                  <SelectTrigger id="month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { num: 1, name: "January" },
                      { num: 2, name: "February" },
                      { num: 3, name: "March" },
                      { num: 4, name: "April" },
                      { num: 5, name: "May" },
                      { num: 6, name: "June" },
                      { num: 7, name: "July" },
                      { num: 8, name: "August" },
                      { num: 9, name: "September" },
                      { num: 10, name: "October" },
                      { num: 11, name: "November" },
                      { num: 12, name: "December" },
                    ].map((month) => (
                      <SelectItem key={month.num} value={month.num.toString()}>
                        {month.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={generateData.year}
                  onChange={(e) => setGenerateData({ ...generateData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                />
              </div>

              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>This will:</strong>
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside mt-2 space-y-1">
                    <li>Calculate performance metrics for all employees</li>
                    <li>Generate official appraisal records</li>
                    <li>Send SMS notifications to employees</li>
                    <li>Notify HR managers of pending reviews</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)} disabled={isGeneratingMonthly}>
                Cancel
              </Button>
              <Button onClick={handleGenerateMonthly} disabled={isGeneratingMonthly} className="bg-blue-600 hover:bg-blue-700">
                {isGeneratingMonthly ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate & Send SMS
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}