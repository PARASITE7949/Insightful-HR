import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import User from "@/models/User";
import Attendance from "@/models/Attendance";
import Task from "@/models/Task";
import Appraisal from "@/models/Appraisal";
import SystemLog from "@/models/SystemLog";
import { sendMonthlyAppraisalSMS, sendAppraisalReminderSMS } from "@/utils/sms";

export const createAttendanceRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { date, checkIn, checkOut, status, workingHours } = req.body;
    const { userId } = req.params;

    // Verify user belongs to same company
    const user = await User.findById(userId);
    if (!user || user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const attendance = new Attendance({
      _id: uuidv4(),
      userId,
      companyId: req.user.companyId,
      date,
      checkIn,
      checkOut,
      status,
      workingHours,
    });

    await attendance.save();

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "ATTENDANCE_CREATED",
      resource: "Attendance",
      description: `Attendance record created for ${date}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Attendance record created",
      data: attendance,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceRecords = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { userId } = req.params;
    const { month, year } = req.query;

    const user = await User.findById(userId);
    if (!user || user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    let query: any = { userId, companyId: req.user.companyId };

    if (month && year) {
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      query.date = { $gte: startDate.toISOString().split("T")[0], $lte: endDate.toISOString().split("T")[0] };
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    res.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAttendanceRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { attendanceId } = req.params;
    const updates = req.body;

    // First, fetch the attendance to check authorization
    const existingAttendance = await Attendance.findById(attendanceId);

    if (!existingAttendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    if (existingAttendance.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Now update the attendance after authorization is confirmed
    const attendance = await Attendance.findByIdAndUpdate(attendanceId, updates, { new: true });

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "ATTENDANCE_UPDATED",
      resource: "Attendance",
      description: `Attendance record updated for ${attendance.date}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Attendance record updated",
      data: attendance,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { title, description, project, status, priority, dueDate } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const task = new Task({
      _id: uuidv4(),
      userId,
      companyId: req.user.companyId,
      title,
      description,
      project,
      status: status || "pending",
      priority: priority || "medium",
      dueDate,
    });

    await task.save();

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "TASK_CREATED",
      resource: "Task",
      description: `Task "${title}" created`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Task created",
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { userId } = req.params;
    const { status } = req.query;

    const user = await User.findById(userId);
    if (!user || user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    let query: any = { userId, companyId: req.user.companyId };

    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query).sort({ dueDate: -1 });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { taskId } = req.params;
    const updates = req.body;

    // First, fetch the task to check authorization
    const existingTask = await Task.findById(taskId);

    if (!existingTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (existingTask.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Now update the task after authorization is confirmed
    const task = await Task.findByIdAndUpdate(taskId, updates, { new: true });

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "TASK_UPDATED",
      resource: "Task",
      description: `Task "${task.title}" updated`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Task updated",
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { taskId } = req.params;

    // First, fetch the task to check authorization
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Now delete the task after authorization is confirmed
    await Task.findByIdAndDelete(taskId);

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "TASK_DELETED",
      resource: "Task",
      description: `Task "${task.title}" deleted`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Task deleted",
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAppraisals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const appraisals = await Appraisal.find({ userId, companyId: req.user.companyId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: appraisals,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all appraisals for company (for HR/Admin)
 */
export const getCompanyAppraisals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { month, year, status } = req.query;

    let query: any = { companyId: req.user.companyId };

    if (month) {
      query.month = month;
    }
    if (year) {
      query.year = parseInt(year as string);
    }
    if (status) {
      query.status = status;
    }

    const appraisals = await Appraisal.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: appraisals,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update appraisal (for HR/Admin)
 */
export const updateAppraisal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { appraisalId } = req.params;
    const updates = req.body;

    // First, fetch the appraisal to check authorization
    const existingAppraisal = await Appraisal.findById(appraisalId);

    if (!existingAppraisal) {
      return res.status(404).json({ success: false, message: "Appraisal not found" });
    }

    if (existingAppraisal.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Now update the appraisal after authorization is confirmed
    const appraisal = await Appraisal.findByIdAndUpdate(
      appraisalId,
      {
        ...updates,
        hrReviewedBy: req.user.name || req.user.email,
        hrReviewedAt: new Date(),
      },
      { new: true }
    );

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "APPRAISAL_UPDATED",
      resource: "Appraisal",
      description: `Appraisal updated for ${appraisal.employeeName}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Appraisal updated",
      data: appraisal,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const users = await User.find({ companyId: req.user.companyId }).select("-password");

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get company-wide attendance for a specific date (for HR/Admin)
 */
export const getCompanyAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { date } = req.query;
    const targetDate = date ? (date as string) : new Date().toISOString().split("T")[0];

    const attendanceRecords = await Attendance.find({
      companyId: req.user.companyId,
      date: targetDate,
    });

    res.json({
      success: true,
      data: attendanceRecords,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { userId } = req.params;
    const updates = req.body;

    // First, fetch the user to check authorization
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Only allow updating users in the same company
    if (existingUser.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Don't allow updating password via this endpoint
    if (updates.password) {
      delete updates.password;
    }

    // Now update the user after authorization is confirmed
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "USER_UPDATED",
      resource: "User",
      description: `User "${existingUser.name}" updated`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "User updated",
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate monthly appraisals and send SMS notifications
export const generateMonthlyAppraisals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Only HR and admin staff can generate appraisals
    if (!["hr_manager", "admin_staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only HR and Admin can generate appraisals" });
    }

    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Month and year are required" });
    }

    // Get all employees in the company
    const employees = await User.find({
      companyId: req.user.companyId,
      role: "employee",
    });

    if (employees.length === 0) {
      return res.json({
        success: true,
        message: "No employees found to appraise",
        data: { generated: 0, smsNotifications: 0 },
      });
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = monthNames[month - 1];

    let generatedCount = 0;
    let smsCount = 0;
    const appraisals = [];

    // Generate appraisals for each employee
    for (const employee of employees) {
      try {
        // Check if appraisal already exists
        const existingAppraisal = await Appraisal.findOne({
          userId: employee._id,
          month: monthName,
          year,
          companyId: req.user.companyId,
        });

        if (existingAppraisal) {
          continue; // Skip if already generated
        }

        // Get attendance records for the month
        const attendanceRecords = await Attendance.find({
          userId: employee._id,
          companyId: req.user.companyId,
          date: {
            $gte: new Date(`${year}-${month.toString().padStart(2, "0")}-01`),
            $lte: new Date(`${year}-${month.toString().padStart(2, "0")}-31`),
          },
        });

        // Get tasks for the month
        const taskRecords = await Task.find({
          userId: employee._id,
          companyId: req.user.companyId,
          createdAt: {
            $gte: new Date(`${year}-${month.toString().padStart(2, "0")}-01`),
            $lte: new Date(`${year}-${month.toString().padStart(2, "0")}-31`),
          },
        });

        // Calculate scores
        const attendanceScore =
          attendanceRecords.length > 0
            ? Math.round(
                ((attendanceRecords.filter(r => r.status === "present" || r.status === "late").length /
                  attendanceRecords.length) *
                  100) as any
              )
            : 0;

        const completedTasks = taskRecords.filter(t => t.status === "completed").length;
        const taskCompletionScore =
          taskRecords.length > 0 ? Math.round((completedTasks / taskRecords.length) * 100) : 75;

        const onTimeCompletions = taskRecords
          .filter(t => t.status === "completed" && new Date(t.completedAt!) <= new Date(t.dueDate))
          .filter(t => t.completedAt).length;

        const projectDeliveryScore =
          completedTasks > 0 ? Math.round((onTimeCompletions / completedTasks) * 100) : 50;

        const overallScore = Math.round(
          attendanceScore * 0.25 + (100 - (100 - taskCompletionScore) * 0.5) * 0.35 + projectDeliveryScore * 0.25 + 75 * 0.15
        );

        // Create appraisal record
        const appraisal = new Appraisal({
          _id: uuidv4(),
          userId: employee._id,
          companyId: req.user.companyId,
          month: monthName,
          year,
          attendanceScore,
          taskCompletionScore,
          projectDeliveryScore,
          overallScore,
          status: "pending",
          generatedAt: new Date(),
        });

        await appraisal.save();
        appraisals.push(appraisal);
        generatedCount++;

        // Send SMS notification to employee
        if (employee.phone && employee.phoneVerified) {
          const smsSent = await sendMonthlyAppraisalSMS(
            employee.phone,
            employee.name,
            monthName,
            year,
            overallScore
          );
          if (smsSent) {
            smsCount++;
          }
        }

        // Log the appraisal generation
        await SystemLog.create({
          userId: req.user.userId,
          companyId: req.user.companyId,
          action: "APPRAISAL_GENERATED",
          resource: "Appraisal",
          description: `Monthly appraisal generated for ${employee.name} (${monthName} ${year}) - Score: ${overallScore}%`,
          ipAddress: req.ip,
        });
      } catch (error: any) {
        console.error(`Error generating appraisal for ${employee.name}:`, error);
        continue;
      }
    }

    // Send reminder SMS to HR managers
    const hrManagers = await User.find({
      companyId: req.user.companyId,
      role: "hr_manager",
    });

    for (const hr of hrManagers) {
      if (hr.phone && hr.phoneVerified) {
        await sendAppraisalReminderSMS(hr.phone, hr.name, generatedCount);
      }
    }

    res.json({
      success: true,
      message: `Generated ${generatedCount} appraisals and sent ${smsCount} SMS notifications`,
      data: {
        generated: generatedCount,
        smsNotifications: smsCount,
        month: monthName,
        year,
        appraisals,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
