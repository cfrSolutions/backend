import Survey from "../models/SurveyBuilder.model.js";
import SurveyResponse from "../models/SurveyBuildResponse.model.js";
export const createSurvey = async (req, res) => {
  try {
    const userId =
  req.user._id ||
  req.user.id ||
  req.user.userId;
  const questions = (req.body.questions || [])
  .filter((q) => q.title?.trim())
  .map((q) => ({
    title: q.title,
    type: q.type,
    required: q.required || false,
    options: q.options || [],
    rows: q.rows || [],
    columns: q.columns || [],

    conditions: (q.conditions || []).map((c) => ({
      operator: c.operator,
      value: c.value,
      action: c.action,
      skipTo: c.skipTo || "",
    })),
  }));

    const survey = await Survey.create({
      business: userId,
      name: req.body.name,
      description: req.body.description,
      completeUrl: req.body.completeUrl,
      disqualifyUrl: req.body.disqualifyUrl,
      quotaFullUrl: req.body.quotaFullUrl,
      questions,
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
    const userId =
      req.user._id ||
      req.user.id ||
      req.user.userId;

    console.log("USER ID:", userId);

   const surveys = await Survey.find({
  business: userId,
})
.sort({ createdAt: -1 })
.select(
  "publicToken name description status createdAt updatedAt questions"
);

    console.log("FOUND SURVEYS:", surveys);

   const result = surveys.map((survey) => ({
  _id: survey._id,
  publicToken: survey.publicToken,

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

export const getPublicSurvey = async (req, res) => {

  try {

    const survey = await Survey.findOne({
      publicToken: req.params.token,
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

export const getSurvey = async (req, res) => {
  try {
    const userId =
      req.user._id ||
      req.user.id ||
      req.user.userId;

    const survey = await Survey.findOne({
      _id: req.params.id,
      business: userId,
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
    const userId =
  req.user._id ||
  req.user.id ||
  req.user.userId;
 const questions = (req.body.questions || [])
  .filter((q) => q.title?.trim())
  .map((q) => ({
    title: q.title,
    type: q.type,
    required: q.required || false,
    options: q.options || [],
    rows: q.rows || [],
    columns: q.columns || [],

    conditions: (q.conditions || []).map((c) => ({
      operator: c.operator,
      value: c.value,
      action: c.action,
      skipTo: c.skipTo || "",
    })),
  }));

    const survey = await Survey.findOneAndUpdate(
      {
        _id: req.params.id,
        business: userId,
      },
      {
        name: req.body.name,
        description: req.body.description,
        completeUrl: req.body.completeUrl,
        disqualifyUrl: req.body.disqualifyUrl,
        quotaFullUrl: req.body.quotaFullUrl,
        questions,
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
    const userId =
      req.user._id ||
      req.user.id ||
      req.user.userId;

    const survey = await Survey.findOneAndDelete({
      _id: req.params.id,
      business: userId,
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


export const submitSurvey = async (req, res) => {

  try {

    const { token } = req.params;

    const { answers, status } = req.body;

    const survey = await Survey.findOne({
  publicToken: token,
});

    if (!survey) {
      return res.status(404).json({
        message: "Survey not found",
      });
    }

    await SurveyResponse.create({

      survey: survey._id,

      business: survey.business,

      publicToken: survey.publicToken,

      answers,

      status,

      ip: req.ip,

      userAgent: req.headers["user-agent"],

      completedAt: new Date(),

    });

    res.json({
      success: true,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }

};

// export const getSurveyResponses = async (req, res) => {
//   try {
//     const responses = await SurveyResponse.find({
//       survey: req.params.surveyId,
//     })
//       .populate("survey")
//       .sort({ createdAt: -1 });

//     res.json(responses);
//   } catch (err) {
//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };

export const getSurveyResponses = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);

    const responses = await SurveyResponse.find({
      survey: req.params.surveyId,
    })
      .sort({ createdAt: -1 });

    res.json({
      survey,
      responses,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};