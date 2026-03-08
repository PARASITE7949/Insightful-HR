import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "employee" as UserRole,
    department: "",
    position: "",
  });
  const [step, setStep] = useState<"form" | "pending">("form");
  const [isLoading, setIsLoading] = useState(false);
  const { register, hasCompanyRegistered } = useAuth();
  const navigate = useNavigate();

  const departments = ["Engineering", "Marketing", "Sales", "Human Resources", "Finance", "Operations", "Administration"];

  const positions: Record<UserRole, string[]> = {
    employee: ["Software Developer", "Marketing Specialist", "Sales Representative", "Analyst", "Designer", "Engineer"],
    hr_manager: ["HR Manager", "HR Director", "Recruitment Head", "HR Business Partner"],
    admin_staff: ["Administrative Manager", "Office Manager", "Operations Coordinator", "Executive Assistant"],
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    setIsLoading(true);
    const success = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      department: formData.department,
      position: formData.position,
      password: formData.password,
    });
    if (success) {
      toast.success("Registration successful! Awaiting super admin approval.");
      setStep("pending");
      setTimeout(() => navigate("/login"), 3000);
    }
    setIsLoading(false);
  };

  if (!hasCompanyRegistered) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>No Company Registered</CardTitle>
            <CardDescription>A company must be registered before users can sign up.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/company-register">
              <Button className="gap-2"><Building2 className="h-4 w-4" /> Register Your Company</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur">
              <Building2 className="h-12 w-12" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold">Join Your Team</h1>
          <p className="text-lg opacity-90">Create your account to access the employee appraisal system.</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Registration</CardTitle>
              <CardDescription>Join our platform as an organization or individual</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="member" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="member" className="gap-2">
                    <User className="h-4 w-4" /> Member
                  </TabsTrigger>
                  <TabsTrigger value="company" className="gap-2">
                    <Building2 className="h-4 w-4" /> Company
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="member">
                  {step === "form" ? (
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Join a Company</h3>
                        <p className="text-sm text-muted-foreground">Create your account using your company email</p>
                      </div>
                      <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" placeholder="Enter your full name" value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Company Email</Label>
                          <Input id="email" type="email" placeholder="you@company.com" value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                          <p className="text-xs text-muted-foreground text-blue-600 bg-blue-50 p-2 rounded">
                            Note: Your email domain must match your company's registered domain for verification.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" type="tel" placeholder="9876543210" maxLength={10} value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" placeholder="••••••••" value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm</Label>
                            <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select value={formData.role}
                            onValueChange={(value: UserRole) => setFormData({ ...formData, role: value, position: "" })}>
                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="hr_manager">HR Manager</SelectItem>
                              <SelectItem value="admin_staff">Admin Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Department</Label>
                            <Select value={formData.department}
                              onValueChange={(value) => setFormData({ ...formData, department: value })}>
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Position</Label>
                            <Select value={formData.position}
                              onValueChange={(value) => setFormData({ ...formData, position: value })}>
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {positions[formData.role]?.map((pos) => (
                                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Registering..." : "Create Member Account"}
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-6 text-center">
                      <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Registration Successful!</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Your account has been created. Your system admin will review and approve your access shortly.
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
                        <p><strong>Name:</strong> {formData.name}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Role:</strong> {formData.role.replace(/_/g, " ")}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You will be redirected shortly...
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="company" className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Register Your Organization</h3>
                      <p className="text-sm text-muted-foreground">
                        Set up a new workspace for your entire company and manage your team efficiently.
                      </p>
                    </div>
                    <ul className="text-sm text-left space-y-2 bg-muted/30 p-4 rounded-lg">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Complete admin control panel
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Employee performance tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Attendance & leave management
                      </li>
                    </ul>
                    <Link to="/company-register" className="block w-full">
                      <Button className="w-full gap-2">
                        Start Company Registration <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
