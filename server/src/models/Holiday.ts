import mongoose, { Schema, Document } from "mongoose";

interface HolidayDocument extends Omit<Document, "_id"> {
  _id: string;
  companyId: string;
  date: string; // YYYY-MM-DD format
  name: string;
  type: "holiday" | "festival" | "government" | "company_event" | "other";
  description?: string;
  isRecurring: boolean; // If true, applies every year
  recurringMonth?: number; // 1-12, for recurring holidays
  recurringDay?: number; // Day of month, for recurring holidays
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<HolidayDocument>(
  {
    _id: {
      type: String,
    },
    companyId: {
      type: String,
      required: [true, "Company ID is required"],
      index: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Holiday name is required"],
    },
    type: {
      type: String,
      enum: ["holiday", "festival", "government", "company_event", "other"],
      required: [true, "Holiday type is required"],
    },
    description: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringMonth: {
      type: Number,
      min: 1,
      max: 12,
    },
    recurringDay: {
      type: Number,
      min: 1,
      max: 31,
    },
  },
  { timestamps: true }
);

// Create compound index for company and date
holidaySchema.index({ companyId: 1, date: 1 });
holidaySchema.index({ companyId: 1, type: 1 });

export default mongoose.model<HolidayDocument>("Holiday", holidaySchema);
