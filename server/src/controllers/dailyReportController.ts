import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import User from "@/models/User";
import Attendance from "@/models/Attendance";
import Task from "@/models/Task";
import DailyReport from "@/models/DailyReport";
import SystemLog from "@/models/SystemLog";
import { sendDailyReportSMS } from "@/utils/sms";

/**
 * Calculate real-time performance metrics for a user
 */
export async function calculateRealTimePerformance(
  userId: string,
  companyId: string,
  date: string
): Promise<{
  attendanceScore: number;
  punctualityScore: number;
  taskCompletionScore: number;
  projectDeliveryScore: number;
  overallScore: number;
  workingHours: number;
  tasksCompleted: number;
  tasksPending: number;
}> {
  // Get today's attendance
  const todayAttendance = await Attendance.findOne({
    userId,
    companyId,
    date,
  });

  // Calculate attendance score
  let attendanceScore = 0;
  let punctualityScore = 0;
  let workingHours = 0;

  if (todayAttendance) {
    attendanceScore = todayAttendance.status === "present" ? 100 : todayAttendance.status === "late" ? 75 : 0;
    
    // Punctuality: check if check-in was on time (before 9:30 AM)
    if (todayAttendance.checkIn) {
      const [hours, minutes] = todayAttendance.checkIn.split(":").map(Number);
      const checkInTime = hours * 60 + minutes;
      const expectedTime = 9 * 60 + 30; // 9:30 AM
      
      if (checkInTime <= expectedTime) {
        punctualityScore = 100;
      } else if (checkInTime <= expectedTime + 30) {
        punctualityScore = 75; // 30 min late
      } else {
        punctualityScore = 50; // More than 30 min late
      }
    }

    workingHours = todayAttendance.workingHours || 0;
  }

  // Get today's tasks
  const todayTasks = await Task.find({
    userId,
    companyId,
    createdAt: {
      $gte: new Date(`${date}T00:00:00`),
      $lt: new Date(`${date}T23:59:59`),
    },
  });

  const tasksCompleted = todayTasks.filter(t => t.status === "completed").length;
  const tasksPending = todayTasks.filter(t => t.status === "pending" || t.status === "in-progress").length;
  const totalTasks = todayTasks.length;

  // Task completion score
  const taskCompletionScore = totalTasks > 0 
    ? Math.round((tasksCompleted / totalTasks) * 100)
    : 75; // Default if no tasks

  // Project delivery score (based on on-time completion)
  const completedTasks = todayTasks.filter(t => t.status === "completed" && t.completedAt);
  const onTimeCompletions = completedTasks.filter(t => {
    if (!t.dueDate || !t.completedAt) return false;
    return new Date(t.completedAt) <= new Date(t.dueDate);
  }).length;

  const projectDeliveryScore = completedTasks.length > 0
    ? Math.round((onTimeCompletions / completedTasks.length) * 100)
    : 50; // Default if no completed tasks

  // Overall score calculation
  const overallScore = Math.round(
    attendanceScore * 0.25 +
    punctualityScore * 0.25 +
    taskCompletionScore * 0.30 +
    projectDeliveryScore * 0.20
  );

  return {
    attendanceScore,
    punctualityScore,
    taskCompletionScore,
    projectDeliveryScore,
    overallScore,
    workingHours,
    tasksCompleted,
    tasksPending,
  };
}

/**
 * Generate daily report after 8 working hours
 */
export const generateDailyReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { userId } = req.params;
    const { date } = req.body;

    const user = await User.findById(userId);
    if (!user || user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const reportDate = date || new Date().toISOString().split("T")[0];

    // Check if report already exists
    const existingReport = await DailyReport.findOne({
      userId,
      companyId: req.user.companyId,
      date: reportDate,
    });

    if (existingReport && existingReport.status === "submitted") {
      return res.json({
        success: true,
        message: "Daily report already submitted",
        data: existingReport,
      });
    }

    // Calculate real-time performance
    const performance = await calculateRealTimePerformance(
      userId,
      req.user.companyId,
      reportDate
    );

    // Check if 8 hours completed
    if (performance.workingHours < 8) {
      return res.status(400).json({
        success: false,
        message: `Only ${performance.workingHours.toFixed(1)} hours completed. Minimum 8 hours required.`,
        data: performance,
      });
    }

    // Create or update daily report
    const summary = `Completed ${performance.tasksCompleted} tasks, ${performance.workingHours.toFixed(1)}h worked. Performance: ${performance.overallScore}%`;

    let dailyReport;
    if (existingReport) {
      dailyReport = await DailyReport.findByIdAndUpdate(
        existingReport._id,
        {
          ...performance,
          employeeName: user.name,
          summary,
          status: "submitted",
          submittedAt: new Date(),
        },
        { new: true }
      );
    } else {
      dailyReport = new DailyReport({
        _id: uuidv4(),
        userId,
        companyId: req.user.companyId,
        employeeName: user.name,
        date: reportDate,
        ...performance,
        summary,
        status: "submitted",
        submittedAt: new Date(),
      });
      await dailyReport.save();
    }

    // Get managers and HR
    const managers = await User.find({
      companyId: req.user.companyId,
      role: { $in: ["hr_manager", "admin_staff"] },
    });

    // Send SMS to managers and HR
    const smsPromises = managers.map(async (manager) => {
      if (manager.phone && manager.phoneVerified) {
        const smsMessage = `${user.name} submitted daily report: ${summary}. Reply via dashboard.`;
        await sendDailyReportSMS(manager.phone, manager.name, user.name, smsMessage);
      }
    });

    await Promise.all(smsPromises);

    // Log the action
    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "DAILY_REPORT_SUBMITTED",
      resource: "DailyReport",
      description: `Daily report submitted for ${reportDate}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Daily report generated and notifications sent",
      data: dailyReport,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get daily report for a user
 */
export const getDailyReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { userId } = req.params;
    const { date } = req.query;

    const user = await User.findById(userId);
    if (!user || user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const reportDate = (date as string) || new Date().toISOString().split("T")[0];

    let report = await DailyReport.findOne({
      userId,
      companyId: req.user.companyId,
      date: reportDate,
    });

    // If no report exists, calculate real-time performance
    if (!report) {
      const performance = await calculateRealTimePerformance(
        userId,
        req.user.companyId,
        reportDate
      );
      
      report = {
        _id: uuidv4(),
        userId,
        companyId: req.user.companyId,
        date: reportDate,
        ...performance,
        summary: "",
        status: "pending",
      } as any;
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all daily reports for company (HR/Admin)
 */
export const getCompanyDailyReports = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { date, status } = req.query;

    let query: any = { companyId: req.user.companyId };

    if (date) {
      query.date = date;
    }
    if (status) {
      query.status = status;
    }

    const reports = await DailyReport.find(query)
      .sort({ date: -1, createdAt: -1 });

    // Populate user data manually since userId is String, not ObjectId
    const userIds = [...new Set(reports.map(r => r.userId))];
    const users = await User.find({ _id: { $in: userIds } }).select("name email phone");
    const userMap = new Map(users.map(u => [u._id, u]));

    const reportsWithUsers = reports.map(report => ({
      ...report.toObject(),
      userId: userMap.get(report.userId) || { _id: report.userId, name: "Unknown", email: "", phone: "" },
    }));

    res.json({
      success: true,
      data: reportsWithUsers,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reply to daily report (Manager/HR)
 */
export const replyToDailyReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { reportId } = req.params;
    const { reply, replyType } = req.body; // replyType: "manager" or "hr"

    if (!["hr_manager", "admin_staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only HR and Admin can reply" });
    }

    const report = await DailyReport.findById(reportId);
    if (!report || report.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const updateData: any = {
      status: "reviewed",
    };

    if (replyType === "manager" || req.user.role === "admin_staff") {
      updateData.managerReply = reply;
      updateData.managerRepliedAt = new Date();
    }

    if (replyType === "hr" || req.user.role === "hr_manager") {
      updateData.hrReply = reply;
      updateData.hrRepliedAt = new Date();
    }

    const updatedReport = await DailyReport.findByIdAndUpdate(reportId, updateData, { new: true });

    // Get employee to send SMS
    const employee = await User.findById(report.userId);
    if (employee && employee.phone && employee.phoneVerified) {
      const senderName = req.user.name || req.user.email;
      const smsMessage = `Reply from ${senderName}: ${reply}`;
      await sendDailyReportSMS(employee.phone, employee.name, senderName, smsMessage);
    }

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "DAILY_REPORT_REPLIED",
      resource: "DailyReport",
      description: `Reply added to daily report for ${employee?.name || "employee"}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Reply sent successfully",
      data: updatedReport,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get real-time performance metrics
 */
export const getRealTimePerformance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { userId } = req.params;
    const { date } = req.query;

    const user = await User.findById(userId);
    if (!user || user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const reportDate = (date as string) || new Date().toISOString().split("T")[0];
    const performance = await calculateRealTimePerformance(userId, req.user.companyId, reportDate);

    // Get performance labels
    const getPerformanceLabel = (score: number): string => {
      if (score >= 90) return "Excellent";
      if (score >= 70) return "Good";
      if (score >= 50) return "Average";
      return "Needs Improvement";
    };

    res.json({
      success: true,
      data: {
        ...performance,
        labels: {
          attendance: getPerformanceLabel(performance.attendanceScore),
          punctuality: getPerformanceLabel(performance.punctualityScore),
          taskCompletion: getPerformanceLabel(performance.taskCompletionScore),
          projectDelivery: getPerformanceLabel(performance.projectDeliveryScore),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
