// import Survey from "../models/SurveyBuilder.model.js";
// import SurveyResponse from "../models/SurveyBuildResponse.model.js";
// export const createSurvey = async (req, res) => {
//   try {
//     const userId =
//   req.user._id ||
//   req.user.id ||
//   req.user.userId;
//   const questions = (req.body.questions || [])
//   .filter((q) => q.title?.trim())
//   .map((q) => ({
//     id: q.id,
//     title: q.title,
//     type: q.type,
//     required: q.required || false,
//     options: q.options || [],
//     rows: q.rows || [],
//     columns: q.columns || [],

//     conditions: (q.conditions || []).map((c) => ({
//       id: c.id,
//       operator: c.operator,
//       value: c.value,
//       action: c.action,
//       skipTo: c.skipTo || "",
//     })),
//   }));

//     const survey = await Survey.create({
//       business: userId,
//       name: req.body.name,
//       description: req.body.description,
//       completeUrl: req.body.completeUrl,
//       disqualifyUrl: req.body.disqualifyUrl,
//       quotaFullUrl: req.body.quotaFullUrl,
//       questions,
//     });

//     res.status(201).json(survey);
//   } catch (err) {
//     // console.error(err);

//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };

// export const getSurveys = async (req, res) => {
//   try {
//     const userId =
//       req.user._id ||
//       req.user.id ||
//       req.user.userId;

//     // console.log("USER ID:", userId);

//    const surveys = await Survey.find({
//   business: userId,
// })
// .sort({ createdAt: -1 })
// .select(
//   "publicToken name description status createdAt updatedAt questions"
// );

//     // console.log("FOUND SURVEYS:", surveys);

//    const result = surveys.map((survey) => ({
//   _id: survey._id,
//   publicToken: survey.publicToken,

//   name: survey.name,
//   description: survey.description,
//   status: survey.status,

//   questions: survey.questions.length,

//   createdAt: survey.createdAt,
//   updatedAt: survey.updatedAt,
// }));

//     res.json(result);

//   } catch (err) {
//     // console.error(err);

//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };

// export const getPublicSurvey = async (req, res) => {

//   try {

//     const survey = await Survey.findOne({
//       publicToken: req.params.token,
//     });

//     if (!survey) {
//       return res.status(404).json({
//         message: "Survey not found",
//       });
//     }

//     res.json(survey);

//   } catch (err) {

//     // console.error(err);

//     res.status(500).json({
//       message: err.message,
//     });

//   }

// };

// export const getSurvey = async (req, res) => {
//   try {
//     const userId =
//       req.user._id ||
//       req.user.id ||
//       req.user.userId;

//     const survey = await Survey.findOne({
//       _id: req.params.id,
//       business: userId,
//     });

//     if (!survey) {
//       return res.status(404).json({
//         message: "Survey not found",
//       });
//     }

//     res.json(survey);

//   } catch (err) {
//     // console.error(err);

//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };

// export const updateSurvey = async (req, res) => {

//   try {
//     const userId =
//   req.user._id ||
//   req.user.id ||
//   req.user.userId;
//  const questions = (req.body.questions || [])
//   .filter((q) => q.title?.trim())
//   .map((q) => ({
//     id: q.id,
//     title: q.title,
//     type: q.type,
//     required: q.required || false,
//     options: q.options || [],
//     rows: q.rows || [],
//     columns: q.columns || [],

//     conditions: (q.conditions || []).map((c) => ({
//       id: c.id,
//       operator: c.operator,
//       value: c.value,
//       action: c.action,
//       skipTo: c.skipTo || "",
//     })),
//   }));

//     const survey = await Survey.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         business: userId,
//       },
//       {
//         name: req.body.name,
//         description: req.body.description,
//         completeUrl: req.body.completeUrl,
//         disqualifyUrl: req.body.disqualifyUrl,
//         quotaFullUrl: req.body.quotaFullUrl,
//         questions,
//         status: req.body.status,
//       },
//       {
//         returnDocument: "after",
//         runValidators: true,
//       }
//     );

//     if (!survey) {

//       return res.status(404).json({
//         message: "Survey not found",
//       });

//     }

//     res.json(survey);

//   } catch (err) {

//     // console.error(err);

//     res.status(500).json({
//       message: err.message,
//     });

//   }

// };

// export const deleteSurvey = async (req, res) => {
//   try {
//     const userId =
//       req.user._id ||
//       req.user.id ||
//       req.user.userId;

//     const survey = await Survey.findOneAndDelete({
//       _id: req.params.id,
//       business: userId,
//     });

//     if (!survey) {
//       return res.status(404).json({
//         message: "Survey not found",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Survey deleted successfully",
//     });

//   } catch (err) {
//     // console.error(err);

//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };


// export const submitSurvey = async (req, res) => {

//   try {

//     const { token } = req.params;

//     const { answers, status } = req.body;

//     const survey = await Survey.findOne({
//   publicToken: token,
// });

//     if (!survey) {
//       return res.status(404).json({
//         message: "Survey not found",
//       });
//     }

//     await SurveyResponse.create({

//       survey: survey._id,

//       business: survey.business,

//       publicToken: survey.publicToken,

//       answers,

//       status,

//       ip: req.ip,

//       userAgent: req.headers["user-agent"],

//       completedAt: new Date(),

//     });

//     res.json({
//       success: true,
//     });

//   } catch (err) {

//     // console.log(err);

//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });

//   }

// };

// // export const getSurveyResponses = async (req, res) => {
// //   try {
// //     const responses = await SurveyResponse.find({
// //       survey: req.params.surveyId,
// //     })
// //       .populate("survey")
// //       .sort({ createdAt: -1 });

// //     res.json(responses);
// //   } catch (err) {
// //     res.status(500).json({
// //       message: err.message,
// //     });
// //   }
// // };

// export const getSurveyResponses = async (req, res) => {
//   try {
//     const survey = await Survey.findById(req.params.surveyId);

//     const responses = await SurveyResponse.find({
//       survey: req.params.surveyId,
//     })
//       .sort({ createdAt: -1 });

//     res.json({
//       survey,
//       responses,
//     });

//   } catch (err) {
//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };


import Survey from "../models/SurveyBuilder.model.js";
import SurveyBuildResponse from "../models/SurveyBuildResponse.model.js";
import InputifyResponse from "../models/SurveyResponse.model.js";
import Project from "../models/Project.model.js";
export const createSurvey = async (req, res) => {
  try {
    const userId =
  req.user._id ||
  req.user.id ||
  req.user.userId;
  const questions = (req.body.questions || [])
  .filter((q) => q.title?.trim())
  .map((q) => ({
    id: q.id,
    title: q.title,
    type: q.type,
    required: q.required || false,
    options: q.options || [],
    rows: q.rows || [],
    columns: q.columns || [],

    conditions: (q.conditions || []).map((c) => ({
      id: c.id,
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
    // console.error(err);

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

    // console.log("USER ID:", userId);

   const surveys = await Survey.find({
  business: userId,
})
.sort({ createdAt: -1 })
.select(
  "publicToken name description status createdAt updatedAt questions"
);

    // console.log("FOUND SURVEYS:", surveys);

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
    // console.error(err);

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

    // console.error(err);

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
    // console.error(err);

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
    id: q.id,
    title: q.title,
    type: q.type,
    required: q.required || false,
    options: q.options || [],
    rows: q.rows || [],
    columns: q.columns || [],

    conditions: (q.conditions || []).map((c) => ({
      id: c.id,
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

    // console.error(err);

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
    // console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};


// export const submitSurvey = async (req, res) => {

//   try {

//     const { token } = req.params;

//     const { answers, status } = req.body;

//     const survey = await Survey.findOne({
//   publicToken: token,
// });

//     if (!survey) {
//       return res.status(404).json({
//         message: "Survey not found",
//       });
//     }

//     await SurveyResponse.create({

//       survey: survey._id,

//       business: survey.business,

//       publicToken: survey.publicToken,

//       answers,

//       status,

//       ip: req.ip,

//       userAgent: req.headers["user-agent"],

//       completedAt: new Date(),

//     });

//     res.json({
//       success: true,
//     });

//   } catch (err) {

//     // console.log(err);

//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });

//   }

// };

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

export const submitSurvey = async (req, res) => {
  try {
    const { token } = req.params;
    const { answers, RID, status } = req.body;

    // --------------------------------------------------
    // 1. Find Survey Builder survey
    // --------------------------------------------------
    const survey = await Survey.findOne({
      publicToken: token,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
      });
    }

    // --------------------------------------------------
    // 2. RID required
    // --------------------------------------------------
    if (!RID) {
      return res.status(400).json({
        success: false,
        message: "RID is required",
      });
    }

    const rid = String(RID).trim().toUpperCase();

    // --------------------------------------------------
    // 3. Normalize status
    // --------------------------------------------------
    const responseStatus =
      status === "DISQUALIFIED"
        ? "DISQUALIFIED"
        : status === "QUOTA"
        ? "QUOTA"
        : "COMPLETE";

    // --------------------------------------------------
    // 4. Find MAIN Inputify response
    // --------------------------------------------------
    const inputifyResponse =
      await InputifyResponse.findOne({
        rid,
        status: "STARTED",
      });

    if (!inputifyResponse) {
      return res.status(404).json({
        success: false,
        message:
          "Inputify response not found or already processed",
      });
    }

    // --------------------------------------------------
    // 5. Project must belong to this business
    // --------------------------------------------------
    if (!inputifyResponse.project) {
      return res.status(403).json({
        success: false,
        message: "Response is not linked to a project",
      });
    }

    const project = await Project.findOne({
      _id: inputifyResponse.project,
      business: survey.business,
    });

    if (!project) {
      return res.status(403).json({
        success: false,
        message:
          "Response does not belong to this business",
      });
    }

    // --------------------------------------------------
    // 6. Target group must exist
    // --------------------------------------------------
    if (!inputifyResponse.targetGroup) {
      return res.status(403).json({
        success: false,
        message:
          "Response is not linked to a target group",
      });
    }

    const targetGroup =
      project.targetGroups.id(
        inputifyResponse.targetGroup
      );

    if (!targetGroup) {
      return res.status(403).json({
        success: false,
        message:
          "Target group does not belong to this project",
      });
    }

    // --------------------------------------------------
    // 7. Save Survey Builder response
    // --------------------------------------------------
    await SurveyBuildResponse.create({
      survey: survey._id,
      business: survey.business,
      publicToken: survey.publicToken,
      answers,
      status: responseStatus,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      completedAt: new Date(),
    });

    // --------------------------------------------------
    // 8. COMPLETE
    // STARTED -> COMPLETION_CONFIRMED
    // --------------------------------------------------
    if (responseStatus === "COMPLETE") {
      const confirmedResponse =
        await InputifyResponse.findOneAndUpdate(
          {
            _id: inputifyResponse._id,
            project: project._id,
            targetGroup: targetGroup._id,
            rid,
            status: "STARTED",
          },
          {
            $set: {
              status: "COMPLETION_CONFIRMED",
              completionConfirmedAt: new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (!confirmedResponse) {
        return res.status(409).json({
          success: false,
          message:
            "Response is no longer eligible for completion",
        });
      }

      return res.json({
        success: true,
        message:
          "Survey submitted and completion confirmed",
        RID: rid,
        status: "COMPLETION_CONFIRMED",
      });
    }

    // --------------------------------------------------
    // 9. DISQUALIFIED / QUOTA
    // --------------------------------------------------
    return res.json({
      success: true,
      message: "Survey response saved",
      RID: rid,
      status: responseStatus,
    });

  } catch (err) {
    console.error("submitSurvey error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

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