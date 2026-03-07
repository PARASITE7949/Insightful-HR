import mongoose, { Schema, Document } from "mongoose";

interface DailyReportDocument extends Omit<Document, "_id"> {
  _id: string;
  userId: string;
  companyId: string;
  employeeName?: string;
  date: string; // YYYY-MM-DD format
  attendanceScore: number;
  punctualityScore: number;
  taskCompletionScore: number;
  projectDeliveryScore: number;
  overallScore: number;
  workingHours: number;
  tasksCompleted: number;
  tasksPending: number;
  summary: string;
  status: "pending" | "submitted" | "reviewed";
  submittedAt?: Date;
  managerReply?: string;
  hrReply?: string;
  managerRepliedAt?: Date;
  hrRepliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dailyReportSchema = new Schema<DailyReportDocument>(
  {
    _id: {
      type: String,
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    companyId: {
      type: String,
      required: [true, "Company ID is required"],
      index: true,
    },
    employeeName: {
      type: String,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      index: true,
    },
    attendanceScore: {
      type: Number,
      default: 0,
    },
    punctualityScore: {
      type: Number,
      default: 0,
    },
    taskCompletionScore: {
      type: Number,
      default: 0,
    },
    projectDeliveryScore: {
      type: Number,
      default: 0,
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    workingHours: {
      type: Number,
      default: 0,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    tasksPending: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "reviewed"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
    },
    managerReply: {
      type: String,
    },
    hrReply: {
      type: String,
    },
    managerRepliedAt: {
      type: Date,
    },
    hrRepliedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

dailyReportSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyReportSchema.index({ companyId: 1, date: 1 });
dailyReportSchema.index({ companyId: 1, status: 1 });

export default mongoose.model<DailyReportDocument>("DailyReport", dailyReportSchema);
