import express from "express";
import apiRouter from "./src/routes/api.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const bakendKopi = () => {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  app.use(express.json());
  app.use(cookieParser()); // WAJIB UNTUK BACA COOKIE!
  
  // KONFIGURASI CORS - Support localhost, IP lokal, dan Vercel
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc)
      if (!origin) {
        return callback(null, true);
      }
      
      // List allowed origins
      const allowedOrigins = [
        CLIENT_ORIGIN,
        "http://localhost:5173",
        /^https:\/\/.*\.vercel\.app$/, // Semua subdomain Vercel
        /^http:\/\/10\.\d+\.\d+\.\d+:5173$/, // IP lokal 10.x.x.x:5173
        /^http:\/\/192\.168\.\d+\.\d+:5173$/, // IP lokal 192.168.x.x:5173
        /^http:\/\/172\.\d+\.\d+\.\d+:5173$/, // IP lokal 172.x.x.x:5173
      ];
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === "string") {
          return origin === allowed;
        }
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        // Log untuk debugging
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Backend is running" });
  });

  app.use("/api", apiRouter);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({
      status: false,
      pesan: "Internal server error",
      error: err.message,
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      status: false,
      pesan: "Endpoint not found",
    });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS allowed origin: ${CLIENT_ORIGIN}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
};

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

bakendKopi();
