import Survey from "../models/SurveyBuilder.model.js";

export const createSurvey = async (req, res) => {
  try {
    const survey = await Survey.create({
      business: req.user.id,
      name: req.body.name,
      description: req.body.description,
      completeUrl: req.body.completeUrl,
      disqualifyUrl: req.body.disqualifyUrl,
      quotaFullUrl: req.body.quotaFullUrl,
      questions: req.body.questions || [],
    });

    res.status(201).json(survey);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};