import express from "express";
import { login, register, logout, getUser, updateUser } from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/getuser", isAuthenticated, getUser);
router.put("/update", isAuthenticated, updateUser); // New update route

export default router;
