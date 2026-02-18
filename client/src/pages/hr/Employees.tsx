import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/lib/apiClient";
import { User, AttendanceRecord, Task } from "@/types";
import { Search, Eye, Mail, Building2, Edit, Loader } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EmployeeMetrics {
  attendanceScore: number;
  punctualityScore: number;
  taskCompletionScore: number;
  projectDeliveryScore: number;
  overallScore: number;
}

export default function HREmployees() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [metricsCache, setMetricsCache] = useState<Record<string, EmployeeMetrics>>({});
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
  });

  if (!user) return null;

  // Calculate metrics from actual employee data
  const calculateEmployeeMetrics = (
    attendanceRecords: AttendanceRecord[],
    tasks: Task[]
  ): EmployeeMetrics => {
    // Attendance Score: percentage of days marked as present or late
    let attendanceScore = 0;
    if (attendanceRecords.length > 0) {
      const presentDays = attendanceRecords.filter(r => r.status === "present" || r.status === "late").length;
      attendanceScore = Math.round((presentDays / attendanceRecords.length) * 100);
    }

    // Punctuality Score: percentage of present days (not late)
    let punctualityScore = 0;
    const presentRecords = attendanceRecords.filter(r => r.status === "present" || r.status === "late");
    if (presentRecords.length > 0) {
      const onTimeDays = attendanceRecords.filter(r => r.status === "present").length;
      punctualityScore = Math.round((onTimeDays / presentRecords.length) * 100);
    }

    // Task Completion Score: percentage of completed tasks with high priority bonus
    let taskCompletionScore = 75; // default
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.status === "completed").length;
      const completionRate = (completedTasks / tasks.length) * 100;

      const highPriorityCompleted = tasks.filter(t => t.priority === "high" && t.status === "completed").length;
      const highPriorityTotal = tasks.filter(t => t.priority === "high").length;
      const priorityBonus = highPriorityTotal > 0 ? (highPriorityCompleted / highPriorityTotal) * 10 : 0;

      taskCompletionScore = Math.min(100, Math.round(completionRate + priorityBonus));
    }

    // Project Delivery Score: on-time completion rate
    let projectDeliveryScore = 75; // default
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.status === "completed");

      if (completedTasks.length > 0) {
        const onTimeCompletions = completedTasks.filter(task => {
          if (!task.completedAt) return false;
          return new Date(task.completedAt) <= new Date(task.dueDate);
        }).length;

        projectDeliveryScore = Math.round((onTimeCompletions / completedTasks.length) * 100);
      } else {
        projectDeliveryScore = 50;
      }
    }

    // Overall Score: weighted average
    const overallScore = Math.round(
      (attendanceScore * 0.25 + punctualityScore * 0.15 + taskCompletionScore * 0.35 + projectDeliveryScore * 0.25)
    );

    return {
      attendanceScore,
      punctualityScore,
      taskCompletionScore,
      projectDeliveryScore,
      overallScore,
    };
  };

  // Fetch employee metrics
  const fetchEmployeeMetrics = async (employeeId: string): Promise<EmployeeMetrics | null> => {
    if (metricsCache[employeeId]) {
      return metricsCache[employeeId];
    }

    try {
      const [attendanceRes, tasksRes] = await Promise.all([
        apiClient.getAttendance(employeeId),
        apiClient.getTasks(employeeId),
      ]);

      const attendanceRecords: AttendanceRecord[] = attendanceRes.success && Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
      const tasks: Task[] = tasksRes.success && Array.isArray(tasksRes.data) ? tasksRes.data : [];

      const metrics = calculateEmployeeMetrics(attendanceRecords, tasks);
      setMetricsCache(prev => ({ ...prev, [employeeId]: metrics }));
      return metrics;
    } catch (error) {
      console.error("Failed to fetch employee metrics", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getUsers();
        if (response.success && Array.isArray(response.data)) {
          const emps = response.data.filter(u => u.role === "employee");
          setEmployees(emps);
          
          // Fetch metrics for all employees in background
          emps.forEach(emp => {
            const empId = emp.id || emp._id;
            fetchEmployeeMetrics(empId);
          });
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmployees();
    // Auto-refresh every 60 seconds for live updates (reduced frequency to avoid rate limits)
    const interval = setInterval(fetchEmployees, 60000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleEditClick = (employee: User) => {
    setSelectedEmployee(employee);
    setEditFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      department: employee.department,
      position: employee.position,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;
    setIsSaving(true);
    
    try {
      const employeeId = selectedEmployee.id || selectedEmployee._id;
      const response = await apiClient.updateUser(employeeId, editFormData);
      if (response.success) {
        toast.success("Employee updated successfully");
        setEmployees(employees.map(emp => 
          (emp.id || emp._id) === employeeId ? { ...emp, ...editFormData } : emp
        ));
        setIsEditing(false);
        setSelectedEmployee(null);
      } else {
        toast.error(response.message || "Failed to update employee");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update employee");
    } finally {
      setIsSaving(false);
    }
  };
  
  const departments = [...new Set(employees.map(e => e.department))];
  
  if (!user) return null;
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading employees...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === "all" || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const getEmployeeMetrics = async (employeeId: string): Promise<EmployeeMetrics | null> => {
    return await fetchEmployeeMetrics(employeeId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage and view employee information</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>
              Showing {filteredEmployees.length} of {employees.length} employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const employeeId = employee.id || employee._id;
                  const metrics = metricsCache[employeeId] || {
                    attendanceScore: 0,
                    punctualityScore: 0,
                    taskCompletionScore: 0,
                    projectDeliveryScore: 0,
                    overallScore: 0,
                  };
                  return (
                    <TableRow key={employeeId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {employee.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{format(new Date(employee.joinDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={metrics.overallScore} className="w-16" />
                          <span className="text-sm font-medium">{metrics.overallScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog onOpenChange={async (open) => {
                          if (open && employee) {
                            // Fetch fresh metrics when dialog opens
                            const empId = employee.id || employee._id;
                            await fetchEmployeeMetrics(empId);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedEmployee(employee)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{isEditing ? "Edit Employee" : "Employee Details"}</DialogTitle>
                              <DialogDescription>
                                {isEditing ? `Update information for ${employee.name}` : `Detailed information about ${employee.name}`}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {isEditing ? (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-email">Email</Label>
                                  <Input
                                    id="edit-email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-phone">Phone</Label>
                                  <Input
                                    id="edit-phone"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-department">Department</Label>
                                  <Select
                                    value={editFormData.department}
                                    onValueChange={(value) => setEditFormData({ ...editFormData, department: value })}
                                  >
                                    <SelectTrigger id="edit-department">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-position">Position</Label>
                                  <Input
                                    id="edit-position"
                                    value={editFormData.position}
                                    onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                                  />
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                    disabled={isSaving}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                  >
                                    {isSaving ? (
                                      <>
                                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      "Save Changes"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold">
                                      {employee.name.split(" ").map(n => n[0]).join("")}
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-semibold">{employee.name}</h3>
                                      <p className="text-muted-foreground">{employee.position}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditClick(employee)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                                
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Mail className="h-4 w-4" />
                                      Email
                                    </div>
                                    <p>{employee.email}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Building2 className="h-4 w-4" />
                                      Department
                                    </div>
                                    <p>{employee.department}</p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="font-semibold">Performance Metrics</h4>
                                  <div className="grid gap-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">Attendance</span>
                                        <Badge variant="outline" className={metrics.attendanceScore >= 85 ? "bg-green-50 text-green-700 border-green-200" : metrics.attendanceScore >= 70 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"}>
                                          {metrics.attendanceScore >= 85 ? "Excellent" : metrics.attendanceScore >= 70 ? "Good" : "Needs Improvement"}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Progress value={metrics.attendanceScore} className="w-24" />
                                        <span className="text-sm w-10 font-medium">{metrics.attendanceScore}%</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">Punctuality</span>
                                        <Badge variant="outline" className={metrics.punctualityScore >= 85 ? "bg-green-50 text-green-700 border-green-200" : metrics.punctualityScore >= 70 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"}>
                                          {metrics.punctualityScore >= 85 ? "Excellent" : metrics.punctualityScore >= 70 ? "Good" : "Needs Improvement"}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Progress value={metrics.punctualityScore} className="w-24" />
                                        <span className="text-sm w-10 font-medium">{metrics.punctualityScore}%</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">Task Completion</span>
                                        <Badge variant="outline" className={metrics.taskCompletionScore >= 85 ? "bg-green-50 text-green-700 border-green-200" : metrics.taskCompletionScore >= 70 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"}>
                                          {metrics.taskCompletionScore >= 85 ? "Excellent" : metrics.taskCompletionScore >= 70 ? "Good" : "Needs Improvement"}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Progress value={metrics.taskCompletionScore} className="w-24" />
                                        <span className="text-sm w-10 font-medium">{metrics.taskCompletionScore}%</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">Project Delivery</span>
                                        <Badge variant="outline" className={metrics.projectDeliveryScore >= 85 ? "bg-green-50 text-green-700 border-green-200" : metrics.projectDeliveryScore >= 70 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"}>
                                          {metrics.projectDeliveryScore >= 85 ? "Excellent" : metrics.projectDeliveryScore >= 70 ? "Good" : "Needs Improvement"}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Progress value={metrics.projectDeliveryScore} className="w-24" />
                                        <span className="text-sm w-10 font-medium">{metrics.projectDeliveryScore}%</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t">
                                      <span className="font-medium">Overall Score</span>
                                      <span className={`text-lg font-bold ${metrics.overallScore >= 85 ? "text-green-600" : metrics.overallScore >= 70 ? "text-yellow-600" : "text-red-600"}`}>{metrics.overallScore}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
