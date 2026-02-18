import express from "express";
import {
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
} from "@/controllers/holidayController";
import { authMiddleware } from "@/middleware/auth";

const router = express.Router();

// Use auth middleware for all routes
router.use(authMiddleware);

// Holiday routes
router.post("/", createHoliday);
router.get("/", getHolidays);
router.put("/:holidayId", updateHoliday);
router.delete("/:holidayId", deleteHoliday);

export default router;
