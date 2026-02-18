import express, { Express } from "express";
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
const frontendOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:8080").split(",").map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true);
    if (frontendOrigins.includes(origin)) return callback(null, true);
    // Allow localhost origins during development (any port)
    if (origin.startsWith("http://localhost") || origin.startsWith("https://localhost")) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy: origin not allowed"));
  },
  credentials: true,
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
app.get("/health", (req, res) => {
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
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

export default app;
