import express from "express";
import {
  insertRequirement,
  getRequirementsByEmployerId,
  getAllRequirements,
} from "../controllers/requirementController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/insert", isAuthenticated, insertRequirement);
router.get("/employer/:employerId", isAuthenticated, getRequirementsByEmployerId);
router.get("/all", isAuthenticated, getAllRequirements);

export default router;
