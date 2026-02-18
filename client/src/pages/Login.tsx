import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User, Users, Shield, Crown, UserCog } from "lucide-react";
import { getUsers } from "@/lib/storage";

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

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setIsLoading(true);
    await login(demoEmail, "demo");
    setIsLoading(false);
  };

  // Get demo accounts dynamically
  const allUsers = getUsers();
  const demoAccounts = [
    { email: allUsers.find(u => u.role === "hr_manager")?.email || "", role: "HR Manager", icon: <Users className="h-4 w-4" /> },
    { email: allUsers.find(u => u.role === "admin_staff")?.email || "", role: "Admin", icon: <UserCog className="h-4 w-4" /> },
    { email: allUsers.find(u => u.role === "employee")?.email || "", role: "Employee", icon: <User className="h-4 w-4" /> },
  ].filter(acc => acc.email);

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
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="demo" disabled={!hasCompanyRegistered}>Demo Access</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
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
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="demo">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Click any account to login instantly
                    </p>
                    {demoAccounts.map((account) => (
                      <Button
                        key={account.email}
                        variant="outline"
                        className="w-full justify-start h-auto py-3"
                        onClick={() => handleDemoLogin(account.email)}
                        disabled={isLoading}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {account.icon}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{account.role}</div>
                            <div className="text-xs text-muted-foreground">{account.email}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex-col gap-4 text-center">
              {!hasCompanyRegistered ? (
                <p className="text-sm text-muted-foreground">
                  No company registered yet?{" "}
                  <Link to="/company-register" className="text-primary font-medium hover:underline">
                    Register your company
                  </Link>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Register here
                  </Link>
                </p>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
