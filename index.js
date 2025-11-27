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
  // KONFIGURASI CORS WAJIB SPESIFIK
  app.use(cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }));

  app.use("/api", apiRouter);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};
bakendKopi();
