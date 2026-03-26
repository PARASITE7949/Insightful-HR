import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Notification from "@/models/Notification";
import User from "@/models/User";

/**
 * Create a notification for all company users
 */
export const createNotification = async (
  companyId: string,
  type: "holiday" | "appraisal" | "report" | "announcement" | "system" | "task" | "festival" | "event" | "government",
  title: string,
  message: string,
  relatedId?: string,
  userIds?: string[] // If not provided, notifies all company users
): Promise<number> => {
  try {
    // Get all user IDs in the company if not specified
    let targetUserIds = userIds;
    if (!targetUserIds || targetUserIds.length === 0) {
      const users = await User.find(
        { companyId, role: { $in: ["employee", "hr_manager", "admin_staff"] } },
        { _id: 1 }
      );
      targetUserIds = users.map((u) => u._id as string);
    }

    // Create notifications for each user
    const notifications = targetUserIds.map((userId) => ({
      _id: uuidv4(),
      companyId,
      userId,
      type,
      title,
      message,
      relatedId,
      isRead: false,
    }));

    const result = await Notification.insertMany(notifications);
    return result.length;
  } catch (error: any) {
    console.error("Error creating notifications:", error);
    return 0;
  }
};

/**
 * Express controller to manually trigger broadcast notifications (Admin/HR)
 */
export const sendNotification = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!["admin_staff", "hr_manager"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: insufficient permissions to manage notifications" });
    }

    const { title, message, type = "announcement", targetUserIds } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    const count = await createNotification(
      req.user.companyId,
      type,
      title,
      message,
      undefined,
      targetUserIds?.length > 0 ? targetUserIds : undefined
    );

    res.json({
      success: true,
      message: `Notification sent to ${count} user(s)`,
      data: { count },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get notifications for the current user
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { limit = 20, skip = 0, unreadOnly = false } = req.query;

    let query: any = {
      companyId: req.user.companyId,
      userId: req.user.userId,
    };

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string)),
      Notification.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const count = await Notification.countDocuments({
      companyId: req.user.companyId,
      userId: req.user.userId,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification || notification.userId !== req.user.userId) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await Notification.updateMany(
      {
        companyId: req.user.companyId,
        userId: req.user.userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
