import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { IAttendanceRecord } from "@/types";

interface AttendanceDocument extends IAttendanceRecord, Omit<Document, "_id"> {
  _id: string;
}

const attendanceSchema = new Schema<AttendanceDocument>(
  {
    _id: {
      type: String,
      default: uuidv4,
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
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    checkIn: {
      type: String,
      default: null,
    },
    checkOut: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half-day"],
      default: "absent",
    },
    workingHours: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: any) {
        ret.id = ret._id;
        return ret;
      }
    }
  }
);

// Create compound index for user, company, and date
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ companyId: 1, date: 1 });

export default mongoose.model<AttendanceDocument>("Attendance", attendanceSchema);
