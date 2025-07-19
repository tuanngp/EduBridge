import dotenv from "dotenv";
dotenv.config({ path: './.env' });
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import donorRoutes from "./routes/donors.js";
import schoolRoutes from "./routes/schools.js";
import deviceRoutes from "./routes/devices.js";
import transferRoutes from "./routes/transfers.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";
import suggestionRoutes from "./routes/suggestions.js";
import deviceHistoryRoutes from "./routes/deviceHistory.js";
import schoolSuggestionRoutes from "./routes/schoolSuggestions.js";
import deviceSuggestionRoutes from "./routes/deviceSuggestions.js";
import voucherRoutes from "./routes/vouchers.js";
import deviceReceiptRoutes from "./routes/deviceReceipt.js";
import productAnalyzerRoutes from "./routes/productAnalyzer.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan("combined"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/device-history", deviceHistoryRoutes);
app.use("/api/school-suggestions", schoolSuggestionRoutes);
app.use("/api/device-suggestions", deviceSuggestionRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/device-receipts", deviceReceiptRoutes);
app.use("/api/product-analyzer", productAnalyzerRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Import error handling middleware
import { errorLogger, apiErrorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Error handling middleware
app.use(errorLogger);
app.use(apiErrorHandler);

// 404 handler
app.use("*", notFoundHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
