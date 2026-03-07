import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User";
import Company from "../models/Company";
import SystemLog from "../models/SystemLog";
import { hashPassword, comparePassword, generateToken, extractDomainFromEmail } from "../utils/auth";

export const registerCompany = async (req: Request, res: Response) => {
  try {
    const { name, domain, adminName, adminEmail, adminPassword, adminPhone } = req.body;

    // Validate input
    if (!name || !domain || !adminName || !adminEmail || !adminPassword || !adminPhone) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({ domain: domain.toLowerCase() });
    if (existingCompany) {
      return res.status(400).json({ success: false, message: "Company domain already registered" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const adminId = uuidv4();
    const companyId = uuidv4();

    // Create company
    const company = await Company.create({
      _id: companyId,
      name,
      domain: domain.toLowerCase(),
      adminId,
    });

    // Create admin user
    const hashedPassword = await hashPassword(adminPassword);
    const user = await User.create({
      _id: adminId,
      companyId,
      email: adminEmail.toLowerCase(),
      name: adminName,
      phone: adminPhone,
      password: hashedPassword,
      role: "admin_staff",
      department: "Administration",
      position: "Administrator",
      phoneVerified: true, // OTP verification disabled - phone is automatically verified
      approvedByAdmin: true, // Admin is auto-approved
      isActive: true,
      joinDate: new Date(),
    });

    // Log the action
    await SystemLog.create({
      userId: adminId,
      companyId,
      action: "COMPANY_REGISTERED",
      resource: "Company",
      description: `Company ${name} registered with domain ${domain}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Company registered successfully",
      data: {
        companyId,
        adminId,
      },
    });
  } catch (error: any) {
    console.error("Register company error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, department, position } = req.body;

    // Validate input
    if (!name || !email || !phone || !password || !role || !department || !position) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Extract domain from email
    const domain = extractDomainFromEmail(email);
    if (!domain) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Check if company exists
    const company = await Company.findOne({ domain });
    if (!company) {
      return res.status(400).json({ success: false, message: "Company not found. Please register company first." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const userId = uuidv4();
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      _id: userId,
      companyId: company._id,
      email: email.toLowerCase(),
      phone,
      name,
      password: hashedPassword,
      role,
      department,
      position,
      phoneVerified: true, // OTP verification disabled - phone is automatically verified
      approvedByAdmin: false, // Awaiting admin approval
      isActive: true,
      joinDate: new Date(),
    });

    // Log the action
    await SystemLog.create({
      userId,
      companyId: company._id,
      action: "USER_REGISTERED",
      resource: "User",
      description: `User ${name} registered with role ${role}, awaiting admin approval`,
      ipAddress: req.ip,
    });

    // Return without token - user must wait for approval
    res.status(201).json({
      success: true,
      message: "Registration successful. Awaiting admin approval.",
      data: {
        userId,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          companyId: company._id,
          approvedByAdmin: false,
        },
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "User account is inactive" });
    }

    // Check if user is approved by admin (except for admin_staff themselves)
    if (user.role !== "admin_staff" && !user.approvedByAdmin) {
      return res.status(401).json({ success: false, message: "Your account is pending admin approval" });
    }

    // Log the action
    await SystemLog.create({
      userId: user._id,
      companyId: user.companyId,
      action: "USER_LOGIN",
      resource: "User",
      description: `User ${user.name} logged in`,
      ipAddress: req.ip,
    });

    const token = generateToken({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: user.department,
          position: user.position,
          companyId: user.companyId,
        },
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        position: user.position,
        companyId: user.companyId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get pending user approvals (admin only)
 */
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const admin = await User.findById(req.user.userId);
    if (!admin || admin.role !== "admin_staff") {
      return res.status(403).json({ success: false, message: "Only admin can view pending approvals" });
    }

    const pendingUsers = await User.find({
      companyId: admin.companyId,
      approvedByAdmin: false,
      role: { $ne: "admin_staff" },
    }).select("-password");

    res.json({
      success: true,
      data: {
        pendingCount: pendingUsers.length,
        users: pendingUsers,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Approve a pending user (admin only)
 */
export const approveUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const admin = await User.findById(req.user.userId);
    if (!admin || admin.role !== "admin_staff") {
      return res.status(403).json({ success: false, message: "Only admin can approve users" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.companyId !== admin.companyId) {
      return res.status(403).json({ success: false, message: "Cannot approve users from other companies" });
    }

    user.approvedByAdmin = true;
    await user.save();

    // Log the action
    await SystemLog.create({
      userId: admin._id,
      companyId: admin.companyId,
      action: "USER_APPROVED",
      resource: "User",
      description: `Admin approved user ${user.name} (${user.role})`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User ${user.name} approved successfully`,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reject a pending user (admin only)
 */
export const rejectUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const admin = await User.findById(req.user.userId);
    if (!admin || admin.role !== "admin_staff") {
      return res.status(403).json({ success: false, message: "Only admin can reject users" });
    }

    const { userId, reason } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.companyId !== admin.companyId) {
      return res.status(403).json({ success: false, message: "Cannot reject users from other companies" });
    }

    user.isActive = false;
    await user.save();

    // Log the action
    await SystemLog.create({
      userId: admin._id,
      companyId: admin.companyId,
      action: "USER_REJECTED",
      resource: "User",
      description: `Admin rejected user ${user.name} (${user.role}). Reason: ${reason || "Not specified"}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User ${user.name} rejected successfully`,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
