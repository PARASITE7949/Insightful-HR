import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  try {
    const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Map roles to their correct route paths
    const roleRoutes: Record<string, string> = {
      hr_manager: "/hr",
      admin_staff: "/admin",
      employee: "/employee",
    };
    const redirectPath = roleRoutes[user.role] || "/login";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
  } catch (error) {
    // If useAuth fails (provider not available), redirect to login
    return <Navigate to="/login" replace />;
  }
}