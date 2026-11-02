
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import projectRoutes from "./routes/project.routes.js";

const app = express();

// =====================================
// CORS CONFIGURATION
// =====================================

const allowedOrigins = (
  process.env.CLIENT_ORIGINS || "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""));

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without Origin (Postman, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("CORS blocked origin:", origin);

    return callback(new Error("Origin not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

// Handle CORS and preflight requests
app.use(cors(corsOptions));

// =====================================
// SECURITY
// =====================================

app.use(helmet());

// =====================================
// BODY PARSER
// =====================================

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

// =====================================
// HEALTH CHECK
// =====================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Azzouzip API is running.",
    timestamp: new Date().toISOString(),
  });
});

// =====================================
// RATE LIMIT
// =====================================

const projectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// =====================================
// PROJECT ROUTES
// =====================================

app.use("/api/projects", projectLimiter, projectRoutes);

// =====================================
// 404 HANDLER
// =====================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// =====================================
// GLOBAL ERROR HANDLER
// =====================================

app.use((error, req, res, next) => {
  console.error("Express error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

export default app;
