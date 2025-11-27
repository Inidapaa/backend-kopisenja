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
  // KONFIGURASI CORS - Support localhost dan IP lokal untuk development
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);
      
      // List allowed origins
      const allowedOrigins = [
        CLIENT_ORIGIN,
        "http://localhost:5173",
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
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }));

  app.use("/api", apiRouter);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};
bakendKopi();
