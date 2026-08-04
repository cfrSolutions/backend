import express from "express";
import auth from "../middleware/auth.js";
import { createSurvey } from "../controllers/surveyBuilder.controller.js";

const router = express.Router();

router.post("/create", auth, createSurvey);

export default router;