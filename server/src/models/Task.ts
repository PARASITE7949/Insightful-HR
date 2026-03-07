import mongoose, { Schema, Document } from "mongoose";
import { ITask } from "@/types";

interface TaskDocument extends ITask, Omit<Document, "_id"> {
  _id: string;
}

const taskSchema = new Schema<TaskDocument>(
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
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    project: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: String,
      required: [true, "Due date is required"],
    },
    completedAt: {
      type: String,
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

taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ companyId: 1, status: 1 });

export default mongoose.model<TaskDocument>("Task", taskSchema);
