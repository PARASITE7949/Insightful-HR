import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { connectDB } from "@/config/database";
import authRoutes from "@/routes/authRoutes";
import userRoutes from "@/routes/userRoutes";
import holidayRoutes from "@/routes/holidayRoutes";
import reportRoutes from "@/routes/reportRoutes";
import notificationRoutes from "@/routes/notificationRoutes";
import { getSystemLogs } from "@/controllers/systemLogController";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/auth";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8082",
  "https://insightful-hr.onrender.com",
  "https://insightful-hr-1.onrender.com"
];

const frontendOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "").split(",").map((s: string) => s.trim()).filter(Boolean);
allowedOrigins.push(...frontendOrigins);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or starts with localhost
    if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost") || origin.startsWith("https://localhost")) {
      return callback(null, true);
    }

    // For production flexibility, if we are in production, maybe be more lenient or log the rejected origin
    if (process.env.NODE_ENV === "production") {
      // In production, we might want to log it but still allow it if we are troubleshooting
      console.log(`CORS attempt from: ${origin}`);
      // For now, let's allow all render origins to avoid blocking the user
      if (origin.endsWith(".onrender.com")) {
        return callback(null, true);
      }
    }

    return callback(new Error("CORS policy: origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}));
app.use(express.json());
app.use(morgan("dev"));

// Rate limiting - more lenient for authenticated users
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "200"), // Increased to 200 requests per minute
  message: JSON.stringify({ success: false, message: "Too many requests, please try again later." }),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/api/system-logs", authMiddleware, getSystemLogs);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
});

export default app;
