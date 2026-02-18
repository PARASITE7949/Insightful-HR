import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowRight } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

export default function CompanyRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    password: "",
    confirmPassword: "",
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const phoneDigits = formData.adminPhone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    setIsLoading(true);
    try {
      const emailDomain = formData.adminEmail.split("@")[1] || "";
      
      const response = await apiClient.registerCompany({
        name: formData.companyName,
        domain: emailDomain,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.password,
        adminPhone: formData.adminPhone,
      });

      if (response.success) {
        toast.success("Company registered successfully! Please login.");
        navigate("/login");
      } else {
        toast.error(response.message || "Failed to register company");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error(err.message || "Failed to register company");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur">
              <Building2 className="h-12 w-12" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold">Register Your Company</h1>
          <p className="text-lg opacity-90">
            Start your journey with our AI-powered Employee Appraisal System.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-primary mb-4">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Register Company</h1>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">
                Company Registration
              </CardTitle>
              <CardDescription>
                Set up your organization and admin account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" placeholder="TechCorp Inc." value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Full Name</Label>
                    <Input id="adminName" placeholder="John Doe" value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email</Label>
                    <Input id="adminEmail" type="email" placeholder="admin@techcorp.com" value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Input id="companyAddress" placeholder="123 Main St, City, State" value={formData.companyAddress}
                      onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPhone">Phone Number (10 digits)</Label>
                    <Input id="adminPhone" type="tel" placeholder="9876543210" maxLength={10} value={formData.adminPhone}
                      onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })} required />
                    <p className="text-xs text-muted-foreground">10-digit phone number</p>
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
                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Register Company"} <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
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
