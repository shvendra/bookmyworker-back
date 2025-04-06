import express from "express";
import {
  insertRequirement,
  getFilteredRequirements,
  assignAgentToRequirement,
} from "../controllers/requirementController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/insert", isAuthenticated, insertRequirement);
router.get("/", isAuthenticated, getFilteredRequirements);
router.put("/assign", isAuthenticated, assignAgentToRequirement);

export default router;
