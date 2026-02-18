import express from "express";
import {
  createAttendanceRecord,
  getAttendanceRecords,
  updateAttendanceRecord,
  getCompanyAttendance,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getAppraisals,
  getCompanyAppraisals,
  updateAppraisal,
  getAllUsers,
  updateUser,
  generateMonthlyAppraisals,
} from "@/controllers/userController";
import {
  generateDailyReport,
  getDailyReport,
  getCompanyDailyReports,
  replyToDailyReport,
  getRealTimePerformance,
} from "@/controllers/dailyReportController";
import { authMiddleware } from "@/middleware/auth";

const router = express.Router();

// Use auth middleware for all routes
router.use(authMiddleware);

// Attendance routes
router.post("/:userId/attendance", createAttendanceRecord);
router.get("/:userId/attendance", getAttendanceRecords);
router.get("/attendance/company", getCompanyAttendance); // Company-wide attendance
router.put("/attendance/:attendanceId", updateAttendanceRecord);

// Task routes
router.post("/:userId/tasks", createTask);
router.get("/:userId/tasks", getTasks);
router.put("/tasks/:taskId", updateTask);
router.delete("/tasks/:taskId", deleteTask);

// Appraisal routes
router.get("/:userId/appraisals", getAppraisals);
router.get("/appraisals/all", getCompanyAppraisals); // Company-wide appraisals
router.put("/appraisals/:appraisalId", updateAppraisal); // Update appraisal
router.post("/appraisals/generate/monthly", generateMonthlyAppraisals); // Generate monthly appraisals

// Get all users
router.get("/", getAllUsers);

// Update user
router.put("/:userId", updateUser);

// Daily Report routes
router.post("/:userId/daily-report", generateDailyReport);
router.get("/:userId/daily-report", getDailyReport);
router.get("/daily-reports/all", getCompanyDailyReports);
router.post("/daily-reports/:reportId/reply", replyToDailyReport);
router.get("/:userId/performance/realtime", getRealTimePerformance);

export default router;
