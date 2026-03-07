export type UserRole = "hr_manager" | "admin_staff" | "employee";

export interface ICompany {
  name: string;
  address?: string;
  domain: string;
  adminId: string;
}

export interface IUser {
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  otpPhone?: string;
  otpPhoneExpiresAt?: Date;
  approvedByAdmin?: boolean;
  name: string;
  password: string;
  role: UserRole;
  department: string;
  position: string;
  joinDate: Date;
  avatar?: string;
  address?: string;
  isActive: boolean;
  companyId: string;
}

export interface IAttendanceRecord {
  userId: string;
  companyId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "absent" | "late" | "half-day";
  workingHours: number;
}

export interface ITask {
  userId: string;
  companyId: string;
  title: string;
  description: string;
  project: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  completedAt?: string;
}

export interface IAppraisalReport {
  userId: string;
  companyId: string;
  employeeName: string;
  department: string;
  month: string;
  year: number;
  attendanceScore: number;
  punctualityScore: number;
  taskCompletionScore: number;
  projectDeliveryScore: number;
  overallScore: number;
  aiAnalysis?: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  hrComments?: string;
  finalRating?: "exceptional" | "exceeds-expectations" | "meets-expectations" | "needs-improvement" | "unsatisfactory";
}

export interface ISystemLog {
  userId: string;
  companyId: string;
  action: string;
  resource: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
}
