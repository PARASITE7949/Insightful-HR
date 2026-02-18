import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Shield, Phone, Mail, Building2, User } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PendingUser {
  id?: string;
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  position: string;
  createdAt: string;
  phoneVerified?: boolean;
}

export default function PendingApprovals() {
  const { user } = useAuth();
  const [users, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getPendingApprovals();
      if (response.success && response.data?.users) {
        setPendingUsers(response.data.users);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch pending approvals");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const response = await apiClient.approveUser(userId);
      if (response.success) {
        toast.success("User approved successfully");
        setPendingUsers(users.filter(u => u._id !== userId));
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
        setPendingUsers(users.filter(u => u._id !== userId));
      } else {
        toast.error(response.message || "Failed to reject user");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reject user");
    } finally {
      setProcessingId(null);
    }
  };

  // Only admin can approve users
  if (!user || user.role !== "admin_staff") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>Only admin can access this page</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Pending User Approvals</h1>
          </div>
          <p className="text-muted-foreground">Review and approve pending user registrations</p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Loading pending approvals...</p>
              </div>
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold">All Set!</h3>
                <p className="text-muted-foreground">No pending user approvals at the moment.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{users.length} user{users.length !== 1 ? "s" : ""} awaiting approval</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map((pendingUser) => (
                <Card key={pendingUser._id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {pendingUser.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{pendingUser.name}</CardTitle>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium">{pendingUser.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium">{pendingUser.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Role</span>
                        <span className="font-medium capitalize">{pendingUser.role.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Department</span>
                        <span className="font-medium">{pendingUser.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Position</span>
                        <span className="font-medium">{pendingUser.position}</span>
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Registered: {format(new Date(pendingUser.createdAt), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                  </CardContent>
                  <div className="border-t mt-4 pt-4 flex gap-2">
                    <Button
                      onClick={() => handleApprove(pendingUser._id)}
                      disabled={processingId === pendingUser._id}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {processingId === pendingUser._id ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      onClick={() => handleReject(pendingUser._id)}
                      disabled={processingId === pendingUser._id}
                      size="sm"
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {processingId === pendingUser._id ? "Rejecting..." : "Reject"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
