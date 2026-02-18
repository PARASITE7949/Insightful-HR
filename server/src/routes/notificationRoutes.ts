import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/controllers/notificationController";
import { authMiddleware } from "@/middleware/auth";

const router = express.Router();

// Use auth middleware for all routes
router.use(authMiddleware);

// Get notifications for current user
router.get("/", getNotifications);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.put("/:notificationId/read", markAsRead);

// Mark all as read
router.put("/all/read", markAllAsRead);

export default router;
