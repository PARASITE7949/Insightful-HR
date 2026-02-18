import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

const MONGO = process.env.MONGODB_URI || process.env.MONGODB || "mongodb://localhost:27017/insightful-hr";

async function main() {
  const filePath = path.resolve(process.cwd(), "server/data/frontend_export.json");

  if (!fs.existsSync(filePath)) {
    console.error("No export file found at server/data/frontend_export.json. Please add your exported JSON and try again.");
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    console.error("Error parsing JSON:", err);
    process.exit(1);
  }

  console.log("Connecting to MongoDB:", MONGO);
  await mongoose.connect(MONGO, { dbName: process.env.MONGODB_DB || undefined });

  // Import models
  const Company = (await import("../src/models/Company")).default;
  const User = (await import("../src/models/User")).default;
  const Task = (await import("../src/models/Task")).default;
  const Attendance = (await import("../src/models/Attendance")).default;
  const Appraisal = (await import("../src/models/Appraisal")).default;
  const SystemLog = (await import("../src/models/SystemLog")).default;

  // Helper to insert arrays safely
  async function safeInsert(Model: any, items: any[], name: string) {
    if (!Array.isArray(items) || items.length === 0) {
      console.log(`No ${name} to import`);
      return;
    }
    try {
      console.log(`Inserting ${items.length} ${name}...`);
      await Model.insertMany(items, { ordered: false });
      console.log(`Inserted ${name}`);
    } catch (err: any) {
      // Mongo duplicate key errors may still be thrown after ordered:false; log and continue
      if (err && err.writeErrors) {
        console.warn(`${name}: some documents failed to insert (likely duplicates). Inserted ${items.length - err.writeErrors.length} / ${items.length}`);
      } else if (err && err.code === 11000) {
        console.warn(`${name}: duplicate key error while inserting`);
      } else {
        console.error(`${name}: error inserting`, err);
      }
    }
  }

  try {
    await safeInsert(Company, payload.companies || [], "companies");
    await safeInsert(User, payload.users || [], "users");
    await safeInsert(Task, payload.tasks || [], "tasks");
    await safeInsert(Attendance, payload.attendances || [], "attendances");
    await safeInsert(Appraisal, payload.appraisals || [], "appraisals");
    await safeInsert(SystemLog, payload.systemlogs || [], "systemlogs");

    console.log("Import complete.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
