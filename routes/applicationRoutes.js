import express from "express";
import {
  insertRequirement,
  getFilteredRequirements
} from "../controllers/requirementController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/insert", isAuthenticated, insertRequirement);
router.get("/", isAuthenticated, getFilteredRequirements);

export default router;
