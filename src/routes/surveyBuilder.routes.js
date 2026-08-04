import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createSurvey,
    getSurveys,
    getSurvey,
    updateSurvey,
    deleteSurvey,
    getPublicSurvey,
 } from "../controllers/surveyBuilder.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, createSurvey);
router.get("/", authMiddleware, getSurveys);
router.get("/public/:token", getPublicSurvey);
router.get("/:id", authMiddleware, getSurvey);
router.put("/:id", authMiddleware, updateSurvey);
router.delete("/:id", authMiddleware, deleteSurvey);


export default router;