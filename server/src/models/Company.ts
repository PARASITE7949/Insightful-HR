import mongoose, { Schema, Document } from "mongoose";
import { ICompany } from "@/types";

interface CompanyDocument extends ICompany, Omit<Document, "_id"> {
  _id: string;
}

const companySchema = new Schema<CompanyDocument>(
  {
    _id: {
      type: String,
    },
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    domain: {
      type: String,
      required: [true, "Domain is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    adminId: {
      type: String,
      required: [true, "Admin ID is required"],
    },
  },
  { timestamps: true, _id: true }
);

export default mongoose.model<CompanyDocument>("Company", companySchema);
