import { Router } from "express";
import { analyzeAndSendProject } from "../controllers/project.controller.js";

const router = Router();

router.post("/analyze", analyzeAndSendProject);

export default router;