import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { IUser } from "@/types";

interface UserDocument extends IUser, Omit<Document, "_id"> {
  _id: string;
}

const userSchema = new Schema<UserDocument>(
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
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      trim: true,
      required: [true, "Phone is required"],
    },
    phoneVerified: {
      type: Boolean,
      default: true, // OTP verification disabled - phone is automatically verified
    },
    otpPhone: {
      type: String,
      select: false,
    },
    otpPhoneExpiresAt: {
      type: Date,
      select: false,
    },
    approvedByAdmin: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["hr_manager", "admin_staff", "employee"],
      default: "employee",
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
    joinDate: {
      type: Date,
      default: new Date(),
    },
    avatar: {
      type: String,
    },
    address: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Create compound index for company and email
userSchema.index({ companyId: 1, email: 1 });

export default mongoose.model<UserDocument>("User", userSchema);
