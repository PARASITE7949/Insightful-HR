import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/apiClient";
import { NotificationsWidget } from "@/components/NotificationsWidget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Clock,
  ListTodo,
  BarChart3,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  Building2,
  UserCog,
  Shield,
  Crown,
  Award,
  Activity,
  User,
  Calendar,
} from "lucide-react";
import { getCompanyById } from "@/lib/storage";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const employeeNav: NavItem[] = [
  { label: "Dashboard", href: "/employee", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Attendance", href: "/employee/attendance", icon: <Clock className="h-5 w-5" /> },
  { label: "Tasks", href: "/employee/tasks", icon: <ListTodo className="h-5 w-5" /> },
  { label: "Performance", href: "/employee/performance", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Daily Report", href: "/employee/daily-report", icon: <FileText className="h-5 w-5" /> },
];

const hrNav: NavItem[] = [
  { label: "Dashboard", href: "/hr", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Employees", href: "/hr/employees", icon: <Users className="h-5 w-5" /> },
  { label: "Daily Reports", href: "/hr/daily-reports", icon: <Activity className="h-5 w-5" /> },
  { label: "Reports", href: "/hr/reports", icon: <FileText className="h-5 w-5" /> },
  { label: "Appraisals", href: "/hr/appraisals", icon: <Award className="h-5 w-5" /> },
  { label: "Calendar", href: "/hr/calendar", icon: <Calendar className="h-5 w-5" /> },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Users", href: "/admin/users", icon: <UserCog className="h-5 w-5" /> },
  { label: "Pending Approvals", href: "/admin/pending-approvals", icon: <Shield className="h-5 w-5" /> },
  { label: "Departments", href: "/admin/departments", icon: <Building2 className="h-5 w-5" /> },
  { label: "Reports", href: "/admin/reports", icon: <FileText className="h-5 w-5" /> },
  { label: "Calendar", href: "/admin/calendar", icon: <Calendar className="h-5 w-5" /> },
  { label: "Daily Reports", href: "/hr/daily-reports", icon: <Activity className="h-5 w-5" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
  { label: "Security", href: "/admin/security", icon: <Shield className="h-5 w-5" /> },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const company = getCompanyById(user.companyId);

  const navItems =
    user.role === "employee" ? employeeNav :
      user.role === "hr_manager" ? hrNav :
        adminNav;

  const roleLabel =
    user.role === "employee" ? "Employee Portal" :
      user.role === "hr_manager" ? "HR Portal" :
        user.role === "admin_staff" ? "Admin Portal" : "Portal";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const allowedRoles = ["admin_staff"];

    const fetchPending = async () => {
      if (!user || !allowedRoles.includes(user.role)) return;
      try {
        const res = await apiClient.getPendingApprovals();
        if (mounted && res.success && res.data) {
          setPendingCount(res.data.pendingCount || res.data.users?.length || 0);
        }
      } catch (e) {
        // ignore errors silently
      }
    };

    fetchPending();
    const id = setInterval(fetchPending, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [user]);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-sidebar-foreground">{company?.name || "Company"}</h2>
          <p className="text-xs text-sidebar-foreground/70">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const isPendingApprovalsLink = item.href === "/admin/pending-approvals";
          const showBadge = isPendingApprovalsLink && pendingCount > 0;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <span className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </span>
              {showBadge && (
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold bg-orange-500 text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {user.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user.position}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>

          <div className="flex-1" />

          <NotificationsWidget />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block text-sm font-medium">{user.name}</span>
                </Button>
                {pendingCount > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <Badge className="rounded-full px-2 py-0.5 text-xs">{pendingCount}</Badge>
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
