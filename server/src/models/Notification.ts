import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

interface NotificationDocument extends Omit<Document, "_id"> {
  _id: string;
  companyId: string;
  userId?: string; // If empty, it's for all users in company
  type: "holiday" | "appraisal" | "report" | "announcement" | "system" | "task" | "festival" | "event" | "government";
  title: string;
  message: string;
  relatedId?: string; // e.g., holidayId, appraisalId
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    companyId: {
      type: String,
      required: [true, "Company ID is required"],
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      enum: ["holiday", "appraisal", "report", "announcement", "system", "task", "festival", "event", "government"],
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    relatedId: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Create compound index for company and user to fetch user notifications
notificationSchema.index({ companyId: 1, userId: 1 });
notificationSchema.index({ companyId: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model<NotificationDocument>("Notification", notificationSchema);
