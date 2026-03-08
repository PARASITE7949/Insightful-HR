import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendNotification,
} from "@/controllers/notificationController";
import { authMiddleware } from "@/middleware/auth";

const router = express.Router();

// Use auth middleware for all routes
router.use(authMiddleware);

// Get notifications for current user
router.get("/", getNotifications);

// Send a new broadcast notification (Admin/HR)
router.post("/send", sendNotification);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.put("/:notificationId/read", markAsRead);

// Mark all as read
router.put("/all/read", markAllAsRead);

export default router;
