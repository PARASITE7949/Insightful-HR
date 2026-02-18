import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import apiClient from "@/lib/apiClient";
import { User, UserRole } from "@/types";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "employee" as UserRole, department: "", position: "", password: "" });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await apiClient.getUsers();
        if (response.success && Array.isArray(response.data)) {
          setUsers(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
    // Auto-refresh every 60 seconds for live updates (reduced frequency to avoid rate limits)
    const interval = setInterval(fetchUsers, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      // Note: User registration should go through /auth/register endpoint
      // This is just for admin to create users directly (if backend supports it)
      // For now, redirect to registration flow or show message
      toast.info("Please use the registration page to add new users. They will appear in pending approvals.");
      setIsDialogOpen(false);
      setFormData({ name: "", email: "", phone: "", role: "employee", department: "", position: "", password: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to add user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!user) return;
    // Note: Backend doesn't have delete user endpoint yet
    // For now, we can deactivate users
    toast.info("User deletion not implemented. Users should be deactivated through settings.");
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin_staff": return "default";
      case "hr_manager": return "secondary";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin_staff": return "Admin";
      case "hr_manager": return "HR Manager";
      default: return "Employee";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage system users and roles</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Add User Info</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To add new users, they should register through the registration page. 
                  New registrations will appear in Pending Approvals for your review.
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
                  <Button onClick={() => window.location.href = "/register"}>Go to Registration</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground mt-2">Loading users...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id || u._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={getRoleBadgeVariant(u.role)}>{getRoleLabel(u.role)}</Badge></TableCell>
                        <TableCell>{u.department}</TableCell>
                        <TableCell>{u.joinDate ? format(new Date(u.joinDate), "MMM d, yyyy") : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={u.approvedByAdmin ? "default" : "secondary"}>
                            {u.approvedByAdmin ? "Approved" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id || u._id)} disabled={u.role === "admin_staff"}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
