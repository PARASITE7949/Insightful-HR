import { Request, Response } from "express";
import SystemLog from "@/models/SystemLog";

/**
 * Get all system logs for company (live)
 */
export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { category, limit = 100, startDate, endDate } = req.query;

    let query: any = { companyId: req.user.companyId };

    if (category && category !== "all") {
      // Map frontend categories to backend actions
      const categoryMap: Record<string, string[]> = {
        auth: ["LOGIN", "LOGOUT", "REGISTER", "PASSWORD_RESET"],
        user: ["USER_CREATED", "USER_UPDATED", "USER_DELETED"],
        appraisal: ["APPRAISAL_CREATED", "APPRAISAL_UPDATED", "APPRAISAL_GENERATED"],
        settings: ["SETTINGS_UPDATED"],
        security: ["SECURITY_ALERT", "UNAUTHORIZED_ACCESS"],
        promotion: ["PROMOTION_CREATED", "BONUS_APPROVED"],
      };

      const actions = categoryMap[category as string] || [];
      if (actions.length > 0) {
        query.action = { $in: actions };
      }
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate as string);
      }
    }

    const logs = await SystemLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string));

    // Get stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allLogs = await SystemLog.find({ companyId: req.user.companyId });
    const todayLogs = await SystemLog.find({
      companyId: req.user.companyId,
      timestamp: { $gte: today },
    });

    const stats = {
      total: allLogs.length,
      auth: allLogs.filter(l => l.action.includes("LOGIN") || l.action.includes("LOGOUT") || l.action.includes("REGISTER")).length,
      security: allLogs.filter(l => l.action.includes("SECURITY") || l.action.includes("UNAUTHORIZED")).length,
      today: todayLogs.length,
    };

    res.json({
      success: true,
      data: logs,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
