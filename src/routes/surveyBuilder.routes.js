import express from "express";
import auth from "../middleware/auth.js";
import { createSurvey,
    getSurveys,
    getSurvey,
    updateSurvey,
    deleteSurvey,
 } from "../controllers/surveyBuilder.controller.js";

const router = express.Router();

router.post("/create", auth, createSurvey);
router.get("/", auth, getSurveys);
router.get("/:id", auth, getSurvey);
router.put("/:id", auth, updateSurvey);
router.delete("/:id", auth, deleteSurvey);

export default router;