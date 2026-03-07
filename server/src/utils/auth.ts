import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_in_production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRY,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): AuthPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const extractDomainFromEmail = (email: string): string => {
  const parts = email.split("@");
  return parts.length > 1 ? parts[1] : "";
};
