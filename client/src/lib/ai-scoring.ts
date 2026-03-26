import { AttendanceRecord, Task, PerformanceMetrics, AppraisalReport, User } from "@/types";
import { getSettings, getUserById, getAttendance, getTasks, addAppraisal, getAppraisals, getUsersByCompany } from "./storage";

interface MonthlyData {
  attendance: AttendanceRecord[];
  tasks: Task[];
}

function getMonthlyData(userId: string, companyId: string, month: number, year: number): MonthlyData {
  const allAttendance = getAttendance(userId, companyId);
  const allTasks = getTasks(userId, companyId);
  
  const attendance = allAttendance.filter(record => {
    const date = new Date(record.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
  
  const tasks = allTasks.filter(task => {
    const createdDate = new Date(task.createdAt);
    return createdDate.getMonth() === month && createdDate.getFullYear() === year;
  });
  
  return { attendance, tasks };
}

function calculateAttendanceScore(attendance: AttendanceRecord[]): number {
  if (attendance.length === 0) return 0;
  
  const presentDays = attendance.filter(r => r.status === "present" || r.status === "late").length;
  const totalWorkDays = attendance.length;
  
  return Math.round((presentDays / totalWorkDays) * 100);
}

function calculatePunctualityScore(attendance: AttendanceRecord[], companyId: string): number {
  const presentRecords = attendance.filter(r => r.status === "present" || r.status === "late");
  if (presentRecords.length === 0) return 0;
  
  const settings = getSettings(companyId);
  const onTimeDays = attendance.filter(r => r.status === "present").length;
  
  return Math.round((onTimeDays / presentRecords.length) * 100);
}

function calculateTaskCompletionScore(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const completionRate = (completedTasks / tasks.length) * 100;
  
  const highPriorityCompleted = tasks.filter(t => t.priority === "high" && t.status === "completed").length;
  const highPriorityTotal = tasks.filter(t => t.priority === "high").length;
  const priorityBonus = highPriorityTotal > 0 ? (highPriorityCompleted / highPriorityTotal) * 10 : 0;
  
  return Math.min(100, Math.round(completionRate + priorityBonus));
}

function calculateProjectScore(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  
  const completedTasks = tasks.filter(t => t.status === "completed");
  
  const onTimeCompletions = completedTasks.filter(task => {
    if (!task.completedAt) return false;
    return new Date(task.completedAt) <= new Date(task.dueDate);
  }).length;
  
  const onTimeRate = completedTasks.length > 0 ? (onTimeCompletions / completedTasks.length) * 100 : 0;
  
  return Math.round(onTimeRate);
}

function generateAIAnalysis(metrics: Omit<PerformanceMetrics, "aiAnalysis" | "strengths" | "areasForImprovement">): {
  analysis: string;
  strengths: string[];
  areasForImprovement: string[];
} {
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  
  if (metrics.attendanceScore >= 95) {
    strengths.push("Excellent attendance record showing strong commitment");
  } else if (metrics.attendanceScore >= 85) {
    strengths.push("Good attendance maintained throughout the month");
  } else if (metrics.attendanceScore < 80) {
    areasForImprovement.push("Attendance needs improvement - consider addressing any underlying issues");
  }
  
  if (metrics.punctualityScore >= 90) {
    strengths.push("Consistently punctual, demonstrating professionalism");
  } else if (metrics.punctualityScore < 75) {
    areasForImprovement.push("Punctuality requires attention - arriving on time is crucial");
  }
  
  if (metrics.taskCompletionScore >= 90) {
    strengths.push("Outstanding task completion rate with high efficiency");
  } else if (metrics.taskCompletionScore >= 75) {
    strengths.push("Reliable task completion maintaining good productivity");
  } else {
    areasForImprovement.push("Task completion rate could be improved with better time management");
  }
  
  if (metrics.projectScore >= 85) {
    strengths.push("Excellent project delivery meeting deadlines consistently");
  } else if (metrics.projectScore < 70) {
    areasForImprovement.push("Project deadlines often missed - consider workload management");
  }
  
  let analysis = "";
  if (metrics.overallScore >= 90) {
    analysis = "Exceptional performance this month. The employee has demonstrated outstanding commitment, efficiency, and professionalism across all measured parameters. Highly recommended for recognition and potential advancement opportunities.";
  } else if (metrics.overallScore >= 80) {
    analysis = "Strong performance with consistent results across most areas. The employee shows dedication and reliability. Minor improvements in some areas would elevate performance to exceptional levels.";
  } else if (metrics.overallScore >= 70) {
    analysis = "Satisfactory performance meeting basic expectations. There are clear opportunities for growth and improvement. Recommend focused development in identified areas.";
  } else if (metrics.overallScore >= 60) {
    analysis = "Performance is below expectations in several areas. Immediate attention and a performance improvement plan are recommended. Consider mentoring or additional training.";
  } else {
    analysis = "Significant performance concerns requiring immediate intervention. A comprehensive review and action plan should be developed with HR involvement.";
  }
  
  return { analysis, strengths, areasForImprovement };
}

export function calculatePerformanceMetrics(userId: string, companyId: string, month: number, year: number): PerformanceMetrics {
  const settings = getSettings(companyId);
  const { attendance, tasks } = getMonthlyData(userId, companyId, month, year);
  
  const attendanceScore = calculateAttendanceScore(attendance);
  const punctualityScore = calculatePunctualityScore(attendance, companyId);
  const taskCompletionScore = calculateTaskCompletionScore(tasks);
  const projectScore = calculateProjectScore(tasks);
  
  const weights = settings.performanceWeights;
  const overallScore = Math.round(
    (attendanceScore * weights.attendance +
      punctualityScore * weights.punctuality +
      taskCompletionScore * weights.taskCompletion +
      projectScore * weights.projects) / 100
  );
  
  const monthNames = ["January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"];
  
  const { analysis, strengths, areasForImprovement } = generateAIAnalysis({
    userId,
    companyId,
    month: monthNames[month],
    year,
    attendanceScore,
    punctualityScore,
    taskCompletionScore,
    projectScore,
    overallScore,
  });
  
  return {
    userId,
    companyId,
    month: monthNames[month],
    year,
    attendanceScore,
    punctualityScore,
    taskCompletionScore,
    projectScore,
    overallScore,
    aiAnalysis: analysis,
    strengths,
    areasForImprovement,
  };
}

export function generateAppraisalReport(userId: string, companyId: string, month: number, year: number): AppraisalReport {
  const user = getUserById(userId);
  if (!user) throw new Error("User not found");
  
  const metrics = calculatePerformanceMetrics(userId, companyId, month, year);
  const monthNames = ["January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"];
  
  const report: AppraisalReport = {
    id: `apr-${userId}-${year}-${month}`,
    userId,
    companyId,
    employeeName: user.name,
    department: user.department,
    month: monthNames[month],
    year,
    metrics,
    status: "pending",
  };
  
  const existing = getAppraisals(companyId).find(a => a.id === report.id);
  if (!existing) {
    addAppraisal(report);
  }
  
  return report;
}

export function generateAllAppraisals(companyId: string, month: number, year: number): AppraisalReport[] {
  const users = getUsersByCompany(companyId).filter((u: User) => u.role === "employee");
  
  return users.map((user: User) => generateAppraisalReport(user.id, companyId, month, year));
}
