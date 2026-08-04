const Survey = require("../models/Survey");

exports.createSurvey = async (req, res) => {
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

    console.log(err);

    res.status(500).json({
      message: err.message,
    });

  }
};