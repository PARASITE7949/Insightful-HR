import express from "express";
import {
  registerCompany,
  register,
  login,
  getCurrentUser,
  getPendingApprovals,
  approveUser,
  rejectUser,
} from "@/controllers/authController";
import { authMiddleware } from "@/middleware/auth";

const router = express.Router();

router.post("/register-company", registerCompany);
router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getCurrentUser);

// Super admin approval endpoints
router.get("/pending-approvals", authMiddleware, getPendingApprovals);
router.post("/approve-user", authMiddleware, approveUser);
router.post("/reject-user", authMiddleware, rejectUser);

export default router;
