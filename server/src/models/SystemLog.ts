import mongoose, { Schema, Document } from "mongoose";
import { ISystemLog } from "@/types";

interface LogDocument extends ISystemLog, Omit<Document, "_id"> {
  _id: string;
}

const logSchema = new Schema<LogDocument>(
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
    action: {
      type: String,
      required: [true, "Action is required"],
    },
    resource: {
      type: String,
      required: [true, "Resource is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: new Date(),
      index: true,
    },
  },
  { timestamps: false }
);

logSchema.index({ companyId: 1, timestamp: -1 });

export default mongoose.model<LogDocument>("SystemLog", logSchema);
