import express from "express";
import welcomeController from "../controller/welcome.controller.js";
import ProductController from "../controller/produk.controller.js";
import AuthController from "../controller/auth.controller.js";
import OrderController from "../controller/order.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMidlleware.js";

const router = express.Router();

router.get("/welcome", welcomeController.Welcome);

router.post("/register", AuthController.AuthRegister);
router.post("/login", AuthController.AuthLogin);
router.post("/logout", AuthController.AuthLogout);
router.get("/me", authMiddleware, AuthController.AuthMe);

// Produk Routes
router.get("/products", upload.single("image"), ProductController.getAll);
router.get("/products/:id", ProductController.getById);
router.post("/products", ProductController.create);
router.put("/products/:id", ProductController.update);
router.delete("/products/:id", ProductController.remove);

// Order Routes
router.post("/orders", OrderController.create);
router.get("/orders", OrderController.list);
router.get("/orders/:id", OrderController.detail);
router.patch("/orders/:id/status", OrderController.updateStatus);

export default router;
