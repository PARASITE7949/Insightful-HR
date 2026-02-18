export type UserRole = "hr_manager" | "admin_staff" | "employee";

export interface Company {
  id: string;
  name: string;
  address?: string;
  domain: string;
  createdAt: string;
  adminId: string;
}

export interface User {
  id: string;
  companyId: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  verified?: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  name: string;
  role: UserRole;
  department: string;
  position: string;
  joinDate: string;
  avatar?: string;
  address?: string;
  isActive: boolean;
}

export interface PromotionRecord {
  id: string;
  userId: string;
  companyId: string;
  type: "promotion" | "bonus" | "increment";
  previousPosition?: string;
  newPosition?: string;
  bonusAmount?: number;
  incrementPercentage?: number;
  reason: string;
  approvedBy: string;
  appraisalId?: string;
  date: string;
  createdAt: string;
}

export interface AttendanceRecord {
    _id?: string;
  id: string;
  userId: string;
  companyId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "absent" | "late" | "half-day";
  workingHours: number;
}

export interface Task {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  description: string;
  project: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  completedAt?: string;
  createdAt: string;
}

export interface PerformanceMetrics {
  userId: string;
  companyId: string;
  month: string;
  year: number;
  attendanceScore: number;
  punctualityScore: number;
  taskCompletionScore: number;
  projectScore: number;
  overallScore: number;
  aiAnalysis: string;
  strengths: string[];
  areasForImprovement: string[];
}

export interface AppraisalReport {
  id: string;
  userId: string;
  companyId: string;
  employeeName: string;
  department: string;
  month: string;
  year: number;
  metrics: PerformanceMetrics;
  status: "pending" | "reviewed" | "approved" | "rejected";
  hrComments?: string;
  hrReviewedBy?: string;
  hrReviewedAt?: string;
  finalRating?: "exceptional" | "exceeds-expectations" | "meets-expectations" | "needs-improvement" | "unsatisfactory";
  promotionRecommended?: boolean;
  bonusRecommended?: boolean;
  incrementPercentage?: number;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  startDate: string;
  endDate?: string;
  teamMembers: string[];
}

export interface SystemSettings {
  companyId: string;
  companyName: string;
  workingHoursPerDay: number;
  lateThresholdMinutes: number;
  performanceWeights: {
    attendance: number;
    punctuality: number;
    taskCompletion: number;
    projects: number;
  };
}

export interface SystemLog {
  id: string;
  companyId: string;
  userId: string;
  userName?: string;
  action: string;
  category: "auth" | "user" | "appraisal" | "settings" | "security" | "promotion";
  details: string;
  ipAddress?: string;
  timestamp: string;
}
