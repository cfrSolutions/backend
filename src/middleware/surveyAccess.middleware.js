import mongoose from "mongoose";
import Survey from "../models/Survey.model.js";

export const adminCanAccessSurvey = async (req, res, next) => {
  try {
    const surveyId = req.params.surveyId || req.params.id;

    if (!surveyId || !mongoose.isValidObjectId(surveyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid survey ID",
      });
    }

    const survey = await Survey.findById(surveyId)
      .select("createdBy");

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
      });
    }

    const role = String(req.user?.role || "")
      .trim()
      .toUpperCase();

    const userId = String(req.user?.userId || "");

    // SUPERADMIN can access any survey
    if (role === "SUPERADMIN") {
      req.survey = survey;
      return next();
    }

    // ADMIN can access only their own survey
    if (
      role === "ADMIN" &&
      String(survey.createdBy) === userId
    ) {
      req.survey = survey;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to access this survey",
    });
  } catch (error) {
    console.error("SURVEY ACCESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to authorize survey access",
    });
  }
};