import SurveyResponse from "../models/SurveyResponse.model.js";

export const surveyStats = async (req, res) => {
  const { surveyId } = req.params;

  const total = await SurveyResponse.countDocuments({ survey: surveyId });
  const completes = await SurveyResponse.countDocuments({
    survey: surveyId,
    status: "COMPLETED",
  });
  const screenouts = await SurveyResponse.countDocuments({
    survey: surveyId,
    status: "DISQUALIFIED",
  });
  const quota = await SurveyResponse.countDocuments({
    survey: surveyId,
    status: "QUOTA_FULL",
  });

  const completedResponses = await SurveyResponse.find({
    survey: surveyId,
    status: "COMPLETED",
  });

  const avgLOI =
    completedResponses.reduce((a, r) => a + (r.durationSeconds || 0), 0) /
    (completedResponses.length || 1);

  const IR = total ? ((completes / total) * 100).toFixed(2) : 0;

  res.json({
    total,
    completes,
    screenouts,
    quota,
    IR,
    avgLOI: Math.round(avgLOI / 60), // minutes
  });
};
const avgDuration = await SurveyResponse.aggregate([
  { $match: { survey: new mongoose.Types.ObjectId(surveyId), status: "COMPLETED" } },
  { $group: { _id: null, avg: { $avg: "$durationSeconds" } } },
]);

const loi = avgDuration[0]?.avg
  ? (avgDuration[0].avg / 60).toFixed(1)
  : 0;
