import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User, Users, Shield, Crown, UserCog } from "lucide-react";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, hasCompanyRegistered, user } = useAuth();
  const navigate = useNavigate();

  const roleRoutes: Record<string, string> = {
    hr_manager: "/hr",
    admin_staff: "/admin",
    employee: "/employee",
  };

  // Navigate after successful login when user is set
  useEffect(() => {
    if (user && !isLoading) {
      navigate(roleRoutes[user.role] || "/employee");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur">
              <Building2 className="h-12 w-12" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold">Employee Appraisal System</h1>
          <p className="text-lg opacity-90">
            AI-powered performance evaluation platform for modern organizations.
            Streamline your HR processes with intelligent analytics.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-primary mb-4">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Employee Appraisal System</h1>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Authentication</CardTitle>
              <CardDescription>Select your login type to continue</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="employee" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="employee" className="gap-2">
                    <User className="h-4 w-4" /> Employee
                  </TabsTrigger>
                  <TabsTrigger value="company" className="gap-2">
                    <Building2 className="h-4 w-4" /> Company
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="employee" className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">Employee Login</h3>
                    <p className="text-sm text-muted-foreground">Access your personal dashboard and tasks</p>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emp-email">Email</Label>
                      <Input
                        id="emp-email"
                        type="email"
                        placeholder="employee@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-password">Password</Label>
                      <Input
                        id="emp-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Employee Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="company" className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">Company Login</h3>
                    <p className="text-sm text-muted-foreground">Admin & HR Management Portal</p>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="comp-email">Email</Label>
                      <Input
                        id="comp-email"
                        type="email"
                        placeholder="admin@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comp-password">Password</Label>
                      <Input
                        id="comp-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Company Sign In"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex-col gap-4 text-center">
              <div className="flex flex-col space-y-2 text-sm text-muted-foreground w-full">
                <p>
                  Don't have an employee account?{" "}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Register Employee
                  </Link>
                </p>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <p>
                  Need to setup a new workspace?{" "}
                  <Link to="/company-register" className="text-primary font-medium hover:underline">
                    Register Company
                  </Link>
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
