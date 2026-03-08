import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    department: string;
    position: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => void;
  setAuthUser: (user: User) => void;
  hasCompanyRegistered: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompanyRegistered, setHasCompanyRegistered] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("authToken");
    if (token) {
      apiClient
        .getCurrentUser()
        .then((response) => {
          if (response.success && response.data) {
            const userData: User = {
              id: response.data.id,
              employeeId: response.data.employeeId,
              companyId: response.data.companyId,
              email: response.data.email,
              name: response.data.name,
              phone: response.data.phone,
              role: response.data.role,
              department: response.data.department,
              position: response.data.position,
              isActive: true,
              joinDate: new Date().toISOString().split("T")[0],
              verified: response.data.verified || false,
              approvedBy: response.data.approvedBy || null,
              approvedAt: response.data.approvedAt || null,
            };
            setUser(userData);
            setHasCompanyRegistered(true);
          }
        })
        .catch(() => {
          localStorage.removeItem("authToken");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);


  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password);

      if (response.success && response.data) {
        const userData: User = {
          id: response.data.user.id,
          employeeId: response.data.user.employeeId,
          companyId: response.data.user.companyId,
          email: response.data.user.email,
          name: response.data.user.name,
          phone: response.data.user.phone,
          role: response.data.user.role,
          department: response.data.user.department,
          position: response.data.user.position,
          isActive: true,
          joinDate: new Date().toISOString().split("T")[0],
          verified: response.data.user.verified || false,
          approvedBy: response.data.user.approvedBy || null,
          approvedAt: response.data.user.approvedAt || null,
        };

        setUser(userData);
        localStorage.setItem("authToken", response.data.token);
        setHasCompanyRegistered(true);
        toast.success(`Welcome back, ${userData.name}!`);
        return true;
      } else {
        toast.error(response.message);
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
      return false;
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    department: string;
    position: string;
    password: string;
  }): Promise<boolean> => {
    try {
      const response = await apiClient.register({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role,
        department: userData.department,
        position: userData.position,
      });

      if (response.success && response.data) {
        const newUser: User = {
          id: response.data.user.id,
          employeeId: response.data.user.employeeId,
          companyId: response.data.user.companyId,
          email: response.data.user.email,
          name: response.data.user.name,
          phone: response.data.user.phone,
          role: response.data.user.role,
          department: response.data.user.department,
          position: response.data.user.position,
          isActive: true,
          joinDate: new Date().toISOString().split("T")[0],
        };

        setUser(newUser);
        localStorage.setItem("authToken", response.data.token);
        setHasCompanyRegistered(true);
        toast.success("Registration successful!");
        return true;
      } else {
        toast.error(response.message);
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
      return false;
    }
  };

  const setAuthUser = (newUser: User) => {
    setUser(newUser);
    setHasCompanyRegistered(true);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        setAuthUser,
        hasCompanyRegistered,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
