import "dotenv/config";
import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { errorHandler } from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();  
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser())

// Set up rate limiter: maximum of 50 requests per 1 minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 1 minute",
});

app.use(limiter);

// ── Swagger API Documentation ──────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Zorvyn API Docs",
}));

app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import recordRoutes from "./routes/record.routes";
import dashboardRoutes from "./routes/dashboard.routes";

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Zorvyn assessment API is running." });
});

// Final handler for errors
app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📄 API Docs available at http://localhost:${PORT}/api/docs`);
  });
}

export default app;
