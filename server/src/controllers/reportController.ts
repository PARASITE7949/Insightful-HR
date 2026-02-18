import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import DailyReport from "@/models/DailyReport";
import User from "@/models/User";
import SystemLog from "@/models/SystemLog";
import { sendDailyReportSMS } from "@/utils/sms";

// Submit daily report
export const submitDailyReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { date, attendanceStatus, punctualityStatus, taskCompletionStatus, projectDeliveryStatus, tasksCompleted, accomplishments, challenges, workingHours } = req.body;
    const { userId } = req.params;

    // Verify user is submitting their own report
    if (userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Can only submit your own report" });
    }

    // Check if report already exists for this date
    const existingReport = await DailyReport.findOne({
      userId,
      date,
      companyId: req.user.companyId,
    });

    if (existingReport) {
      return res.status(400).json({ success: false, message: "Report already submitted for this date" });
    }

    const report = new DailyReport({
      _id: uuidv4(),
      userId,
      companyId: req.user.companyId,
      date,
      attendanceStatus,
      punctualityStatus,
      taskCompletionStatus,
      projectDeliveryStatus,
      tasksCompleted,
      accomplishments,
      challenges,
      workingHours,
      status: "submitted",
    });

    await report.save();

    // Get employee and manager info
    const employee = await User.findById(userId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Send SMS notifications to managers and HR
    const managers = await User.find({
      companyId: req.user.companyId,
      role: { $in: ["hr_manager", "admin_staff"] },
    });

    let smsSentCount = 0;
    for (const manager of managers) {
      if (manager.phone && manager.phoneVerified) {
        const summary = `${employee.name} submitted daily report for ${date}. Working Hours: ${workingHours}. Task Completion: ${taskCompletionStatus}. Login to HR portal to view details.`;
        const smsSent = await sendDailyReportSMS(manager.phone, manager.name, employee.name, summary);
        if (smsSent) {
          smsSentCount++;
        }
      }
    }

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "DAILY_REPORT_SUBMITTED",
      resource: "DailyReport",
      description: `Daily report submitted for ${date} - Working Hours: ${workingHours}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Report submitted successfully. SMS sent to ${smsSentCount} managers/HR`,
      data: report,
      smsSent: smsSentCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all reports for an employee
export const getEmployeeReports = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { userId } = req.params;
    const { month, year } = req.query;

    // Allow employees to see their own, managers/HR to see company reports
    if (
      userId !== req.user.userId &&
      !["hr_manager", "admin_staff"].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const user = await User.findById(userId);
    if (!user || user.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let query: any = { userId, companyId: req.user.companyId };

    if (month && year) {
      const startDate = new Date(`${year}-${month.toString().padStart(2, "0")}-01`);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      query.date = {
        $gte: startDate.toISOString().split("T")[0],
        $lte: endDate.toISOString().split("T")[0],
      };
    }

    const reports = await DailyReport.find(query).sort({ date: -1 });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all pending reports for managers/HR
export const getPendingReports = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!["hr_manager", "admin_staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only managers and HR can view pending reports" });
    }

    const reports = await DailyReport.find({
      companyId: req.user.companyId,
      status: "submitted",
    })
      .sort({ submittedAt: -1 })
      .populate("userId", "name email department");

    res.json({
      success: true,
      data: reports,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add response to report
export const addReportResponse = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!["hr_manager", "admin_staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only managers and HR can respond to reports" });
    }

    const { reportId } = req.params;
    const { message } = req.body;

    const report = await DailyReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    if (report.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Add response
    report.responses.push({
      userId: req.user.userId,
      userName: user.name,
      userRole: req.user.role === "hr_manager" ? "hr_manager" : "admin_staff",
      message,
      timestamp: new Date(),
    });

    // Update status to acknowledged if first response
    if (report.status === "submitted") {
      report.status = "acknowledged";
    }

    await report.save();

    // Send SMS to employee notifying them of response
    const employee = await User.findById(report.userId);
    if (employee && employee.phone && employee.phoneVerified) {
      await sendDailyReportSMS(
        employee.phone,
        employee.name,
        user.name,
        `${user.name} (${user.role === "hr_manager" ? "HR" : "Admin"}) responded to your daily report for ${report.date}.`
      );
    }

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "REPORT_RESPONSE_ADDED",
      resource: "DailyReport",
      description: `Response added to daily report for ${report.date}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Response added successfully",
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update report status
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!["hr_manager", "admin_staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only managers and HR can update report status" });
    }

    const { reportId } = req.params;
    const { status } = req.body;

    if (!["submitted", "acknowledged", "reviewed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const report = await DailyReport.findByIdAndUpdate(reportId, { status }, { new: true });

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "REPORT_STATUS_UPDATED",
      resource: "DailyReport",
      description: `Daily report status updated to ${status}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Report status updated",
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
