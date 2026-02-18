import mongoose, { Schema, Document } from "mongoose";
import { IAppraisalReport } from "@/types";

interface AppraisalDocument extends IAppraisalReport, Document {}

const appraisalSchema = new Schema<AppraisalDocument>(
  {
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
      required: [true, "Employee name is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
    },
    month: {
      type: String,
      required: [true, "Month is required"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
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
    projectScore: {
      type: Number,
      default: 0,
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    aiAnalysis: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "approved", "rejected"],
      default: "pending",
    },
    hrComments: {
      type: String,
    },
    finalRating: {
      type: String,
      enum: ["exceptional", "exceeds-expectations", "meets-expectations", "needs-improvement", "unsatisfactory"],
    },
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc: any, ret: any) {
        ret.id = ret._id;
        return ret;
      }
    }
  }
);

appraisalSchema.index({ userId: 1, month: 1, year: 1 });
appraisalSchema.index({ companyId: 1, status: 1 });

export default mongoose.model<AppraisalDocument>("Appraisal", appraisalSchema);
