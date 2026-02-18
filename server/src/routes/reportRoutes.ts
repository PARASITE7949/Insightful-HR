import express from "express";
import {
  submitDailyReport,
  getEmployeeReports,
  getPendingReports,
  addReportResponse,
  updateReportStatus,
} from "@/controllers/reportController";
import { authMiddleware } from "@/middleware/auth";

const router = express.Router();

// Use auth middleware for all routes
router.use(authMiddleware);

// Submit daily report
router.post("/:userId/daily-report", submitDailyReport);

// Get employee's reports
router.get("/:userId/daily-reports", getEmployeeReports);

// Get pending reports (for managers/HR)
router.get("/company/pending-reports", getPendingReports);

// Add response to report
router.post("/:reportId/response", addReportResponse);

// Update report status
router.put("/:reportId/status", updateReportStatus);

export default router;
