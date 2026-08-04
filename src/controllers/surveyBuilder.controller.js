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

export const getSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find({
      business: req.user.id,
    })
      .sort({ createdAt: -1 })
      .select(
        "name description status createdAt updatedAt questions"
      );

    const result = surveys.map((survey) => ({
      _id: survey._id,
      name: survey.name,
      description: survey.description,
      status: survey.status,
      questions: survey.questions.length,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
    }));

    res.json(result);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

export const getSurvey = async (req, res) => {

  try {

    const survey = await Survey.findOne({
      _id: req.params.id,
      business: req.user.id,
    });

    if (!survey) {
      return res.status(404).json({
        message: "Survey not found",
      });
    }

    res.json(survey);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message,
    });

  }

};

export const updateSurvey = async (req, res) => {

  try {

    const survey = await Survey.findOneAndUpdate(
      {
        _id: req.params.id,
        business: req.user.id,
      },
      {
        name: req.body.name,
        description: req.body.description,
        completeUrl: req.body.completeUrl,
        disqualifyUrl: req.body.disqualifyUrl,
        quotaFullUrl: req.body.quotaFullUrl,
        questions: req.body.questions,
        status: req.body.status,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!survey) {

      return res.status(404).json({
        message: "Survey not found",
      });

    }

    res.json(survey);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message,
    });

  }

};

export const deleteSurvey = async (req, res) => {

  try {

    const survey = await Survey.findOneAndDelete({
      _id: req.params.id,
      business: req.user.id,
    });

    if (!survey) {

      return res.status(404).json({
        message: "Survey not found",
      });

    }

    res.json({
      success: true,
      message: "Survey deleted successfully",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message,
    });

  }

};