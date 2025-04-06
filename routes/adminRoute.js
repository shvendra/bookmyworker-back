import express from "express";
import { getCaptcha, loginAdmin } from "../controllers/adminController.js";
const router = express.Router();

router.get("/captcha", getCaptcha);
router.post("/login", loginAdmin);

export default router;
