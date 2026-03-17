import Survey from "../models/Survey.js";
import SurveyResponse from "../models/SurveyResponse.js";

export const startSurvey = async (req, res) => {
  try {
    const { surveyId } = req.body;
    const userId = req.user.id;

    const survey = await Survey.findById(surveyId);

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const response = await SurveyResponse.create({
      userId,
      surveyId,
      status: "started"
    });

    const responseId = response._id;

    const separator = survey.externalUrl.includes("?") ? "&" : "?";

    const redirectUrl =
      `${survey.externalUrl}${separator}${survey.trackingPlaceholder}=${responseId}`;

    res.json({ redirectUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to start survey" });
  }
};
