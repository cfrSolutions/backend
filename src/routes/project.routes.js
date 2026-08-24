// Business side
import express from "express";
import Project from "../models/Project.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { businessOnly } from "../middleware/business.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";
import CPI from "../models/CPI.model.js";

const router = express.Router();

// router.post("/create", authMiddleware, businessOnly, async (req, res) => {
//   const userId = req.user._id || req.user.id || req.user.userId;

//   try {
//     const generateToken = () => crypto.randomBytes(24).toString("hex");
    
//     const project = await Project.create({
//       ...req.body,
//        name: req.body.name,

//       description:
//         req.body.description || "",

//       business: userId,
//       status: "DRAFT",
//       targetGroups: [],
//       targetCompletes: req.body.targetCompletes,
//       completes: 0, 
//       surveyId: "SURV-" + Date.now(),

//       redirects: {
//         start: { token: generateToken() },
//         complete: { token: generateToken() },
//         disqualified: { token: generateToken() },
//         quotaFull: { token: generateToken() },
//       },

//       disqualified: 0,
//       quotaFull: 0,
//       totalResponses: 0,
//       business: userId,
//     });

//     res.json(project);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

router.post(
  "/create",
  authMiddleware,
  businessOnly,
  async (req, res) => {
    try {
      const userId =
        req.user._id ||
        req.user.id ||
        req.user.userId;

      if (!userId) {
        return res.status(401).json({
          message: "User not found in authentication token",
        });
      }

      const generateToken = () =>
        crypto.randomBytes(24).toString("hex");

      const {
        name,
        description,
        sector,
        market,
        targetCompletes,
        ageFrom,
        ageTo,
        gender,
        loi,
        incidence,
        budget,
        timeline,
        openEnded,
        devices,
      } = req.body;

      const project = await Project.create({
        name,
        description: description || "",

        sector,
        market,
        targetCompletes,
        ageFrom,
        ageTo,
        gender,
        loi,
        incidence,
        budget,
        timeline,
        openEnded,
        devices,

        // 🔐 ALWAYS from authenticated user
        business: userId,

        // 🔐 SERVER CONTROLLED
        status: "DRAFT",
        targetGroups: [],
        completes: 0,
        disqualified: 0,
        quotaFull: 0,
        totalResponses: 0,

        surveyId: "SURV-" + Date.now(),

        // 🔐 SERVER GENERATED
        redirects: {
          start: {
            token: generateToken(),
          },
          complete: {
            token: generateToken(),
          },
          disqualified: {
            token: generateToken(),
          },
          quotaFull: {
            token: generateToken(),
          },
        },
      });

     return res.status(201).json({
  message: "Project created successfully",
  project: {
    _id: project._id,
    name: project.name,
    description: project.description,
    sector: project.sector,
    market: project.market,
    targetCompletes: project.targetCompletes,
    ageFrom: project.ageFrom,
    ageTo: project.ageTo,
    gender: project.gender,
    loi: project.loi,
    incidence: project.incidence,
    budget: project.budget,
    timeline: project.timeline,
    openEnded: project.openEnded,
    devices: project.devices,

    status: project.status,
    surveyId: project.surveyId,

    // ✅ SEND REDIRECTS TO FRONTEND
    redirects: project.redirects,

    createdAt: project.createdAt,
  },
});

    } catch (err) {
      // console.error("CREATE PROJECT ERROR:", err);

      return res.status(500).json({
        message: "Failed to create project",
      });
    }
  }
);

router.get(
  "/",
  authMiddleware,
  businessOnly,
  async (req, res) => {
    try {
      const userId =
        req.user._id ||
        req.user.id ||
        req.user.userId;

      if (!userId) {
        return res.status(401).json({
          message: "User not found in authentication token",
        });
      }

      // const projects = await Project.find({
      //   business: userId,
      // }).sort({
      //   createdAt: -1,
      // });

//       const projects = await Project.find({
//   business: userId,
// })
//   .select("-redirects -clientKeysFile")
//   .sort({ createdAt: -1 });
const projects = await Project.find(
        {
          business: userId,
        },
        {
          // Safe fields for business dashboard
          name: 1,
          description: 1,
          sector: 1,
          market: 1,

          targetCompletes: 1,
          completes: 1,

          ageFrom: 1,
          ageTo: 1,
          gender: 1,
          loi: 1,
          incidence: 1,

          budget: 1,
          timeline: 1,
          openEnded: 1,
          devices: 1,

          status: 1,
          surveyId: 1,
          surveyLinks: 1,

          targetGroups: 1,

          createdAt: 1,
          updatedAt: 1,

        }
      )
        .sort({
          createdAt: -1,
        })
        .lean();


      return res.json(projects);

    } catch (err) {
      // console.error("GET BUSINESS PROJECTS ERROR:", err);

      return res.status(500).json({
        message: "Failed to fetch projects",
      });
    }
  }
);

// router.get("/check-cpi", authMiddleware, businessOnly, async (req, res) => {

//   const data = await CPI.find().limit(5);

//   res.json(data);

// });

// router.get("/:id", authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user._id || req.user.id || req.user.userId;
//     const project = await Project.findById(req.params.id);

//     if (!project) {
//       return res.status(404).json({ message: "Not found" });
//     }

//     // if (project.business.toString() !== req.userId.toString()) {
//     //   return res.status(403).json({ message: "Unauthorized" });
//     // }
//     // console.log("ADMIN PROJECT:");
//     console.log(JSON.stringify(project, null, 2));
//     res.json(project);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// router.get(
//   "/:id",
//   authMiddleware,
//   businessOnly,
//   async (req, res) => {
//     try {
//       const userId =
//         req.user._id ||
//         req.user.id ||
//         req.user.userId;

//       if (!userId) {
//         return res.status(401).json({
//           message: "User not found in authentication token",
//         });
//       }

//       const project = await Project.findOne({
//         _id: req.params.id,
//         business: userId,
//       });

//       if (!project) {
//         return res.status(404).json({
//           message: "Project not found",
//         });
//       }

//       return res.json(project);

//     } catch (err) {
//       console.error("GET PROJECT ERROR:", err);

//       return res.status(500).json({
//         message: "Failed to fetch project",
//       });
//     }
//   }
// );

router.get(
  "/:id",
  authMiddleware,
  businessOnly,
  async (req, res) => {
    try {
      const userId =
        req.user._id ||
        req.user.id ||
        req.user.userId;

      if (!userId) {
        return res.status(401).json({
          message: "User not found in authentication token",
        });
      }

      const project = await Project.findOne({
        _id: req.params.id,
        business: userId,
      }).select(
        "_id name description sector market targetCompletes ageFrom ageTo gender loi incidence budget timeline openEnded devices status surveyId redirects surveyLinks targetGroups completes disqualified quotaFull totalResponses createdAt updatedAt"
      );

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      return res.json(project);

    } catch (err) {
      console.error("GET PROJECT ERROR:", err);

      return res.status(500).json({
        message: "Failed to fetch project",
      });
    }
  }
);

router.put("/:id/survey-links", authMiddleware, businessOnly, async(req, res)=>{
  try{
    const userId = req.user._id || req.user.id || req.user.userId;
    const project = await Project.findOne({
      _id: req.params.id,
      business: userId,
    });

    if(!project){
      return res.status(403).json({message: "Unauthorize"});
    }
    
    const {test, live} = req.body;
    if (!test || !live) {
  return res.status(400).json({
    message: "Test and live survey links are required",
  });
}
    project.surveyLinks = {test, live};
    project.status = "TESTING";
    await project.save();
    res.json({message: "Links saved successfully"});
  }
  catch(err){
    res.status(500).json({message: err.message});
  }
});



const upload = multer({ storage: multer.memoryStorage(), limits: {
    fileSize: 5 * 1024 * 1024
  } });

router.put(
  "/:id/upload-keys",
  authMiddleware,
  businessOnly,
  upload.single("file"),
  async (req, res) => {
    try {
      const userId = req.user._id || req.user.id || req.user.userId;

      const project = await Project.findOne({
        _id: req.params.id,
        business: userId,
      }).select("-clientKeysFile");

      if (!project) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          type: "authenticated",
          folder: "client-keys",
        },
        async (error, result) => {
          if (error) {
            console.log("CLOUDINARY ERROR:", error);
            return res.status(500).json({
              message: "File upload failed",
            });
          }

          // project.clientKeysFile = result.secure_url;
          project.clientKeysFile = result.public_id;
          await project.save();

         res.json({
  message: "Uploaded successfully",
});
        }
      );

      stream.end(req.file.buffer); // ✅ correct

    } catch (err) {
      console.log("UPLOAD ERROR:", err);
       return res.status(500).json({
        message: "Upload failed",
      });
    }
  }
);
// router.get(
//   "/:id/client-keys",
//   authMiddleware,
//   businessOnly,
//   async (req, res) => {
//     try {
//       const userId =
//         req.user._id ||
//         req.user.id ||
//         req.user.userId;

//       const project = await Project.findOne({
//         _id: req.params.id,
//         business: userId,
//       });

//       if (!project) {
//         return res.status(403).json({
//           message: "Unauthorized",
//         });
//       }

//       if (!project.clientKeysFile) {
//         return res.status(404).json({
//           message: "Client keys file not found",
//         });
//       }

//       // Generate a temporary authenticated Cloudinary URL here
//       // instead of exposing a permanent public URL.

//       // return temporary URL...
      
//     } catch (err) {
//       console.error("GET CLIENT KEYS ERROR:", err);

//       return res.status(500).json({
//         message: "Failed to access client keys",
//       });
//     }
//   }
// );

// ADMIN → GO LIVE
router.put("/admin/project/:id/go-live", authMiddleware, adminOnly, async (req, res) => {
  try {
    // const userId = req.user._id || req.user.id || req.user.userId;
    const project = await Project.findById(req.params.id);
    if (!project) {
  return res.status(404).json({
    message: "Project not found",
  });
}
    project.status = "LIVE";

    await project.save();

    res.json({ message: "Project moved to LIVE" });
  } catch (err) {
    return res.status(500).json({
        message: "Failed to move project live",
      });
  }
});

// router.post(
//   "/calculate-cpi", authMiddleware, businessOnly,
//   async (req, res) => {

//     try {

//       const {
//         country,
//         ir,
//         loi,
//       } = req.body;

//      const rates = await CPI.find({
//   country: {
//     $regex: new RegExp(
//       `^${country.trim()}$`,
//       "i"
//     ),
//   },
// });

//       if (!rates.length) {
//         return res.status(404).json({
//           message: "No CPI found",
//         });
//       }

//       let bestRate = null;
//       let bestScore = Infinity;

//       rates.forEach(rate => {

//         const score =
//           Math.abs(rate.ir - ir) +
//           Math.abs(rate.loi - loi);

//         if(score < bestScore){

//           bestScore = score;
//           bestRate = rate;

//         }
//       });

//       res.json({
//         cpi: bestRate.cpi,
//       });

//     } catch(err){

//       console.log(err);

//       res.status(500).json({
//         message: err.message,
//       });
//     }
//   }
// );

router.post(
  "/calculate-cpi",
  authMiddleware,
  businessOnly,
  async (req, res) => {
    try {
      const { country, ir, loi } = req.body;

      // -----------------------------
      // 1. Validate country
      // -----------------------------
      if (
        typeof country !== "string" ||
        !country.trim()
      ) {
        return res.status(400).json({
          message: "Country is required",
        });
      }

      // -----------------------------
      // 2. Validate IR
      // -----------------------------
      const numericIr = Number(ir);

      if (
        !Number.isFinite(numericIr) ||
        numericIr < 0 ||
        numericIr > 100
      ) {
        return res.status(400).json({
          message: "Invalid incidence rate",
        });
      }

      // -----------------------------
      // 3. Validate LOI
      // -----------------------------
      const numericLoi = Number(loi);

      if (
        !Number.isFinite(numericLoi) ||
        numericLoi <= 0
      ) {
        return res.status(400).json({
          message: "Invalid LOI",
        });
      }

      // -----------------------------
      // 4. Escape country for regex
      // -----------------------------
      const escapedCountry = country
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // -----------------------------
      // 5. Get CPI rates for country
      // -----------------------------
      const rates = await CPI.find({
        country: {
          $regex: `^${escapedCountry}$`,
          $options: "i",
        },
      }).select("country ir loi cpi");

      if (!rates.length) {
        return res.status(404).json({
          message: "No CPI found for this country",
        });
      }

      // -----------------------------
      // 6. Find closest CPI
      // -----------------------------
      let bestRate = null;
      let bestScore = Infinity;

      for (const rate of rates) {
        const rateIr = Number(rate.ir);
        const rateLoi = Number(rate.loi);

        if (
          !Number.isFinite(rateIr) ||
          !Number.isFinite(rateLoi)
        ) {
          continue;
        }

        const score =
          Math.abs(rateIr - numericIr) +
          Math.abs(rateLoi - numericLoi);

        if (score < bestScore) {
          bestScore = score;
          bestRate = rate;
        }
      }

      if (!bestRate) {
        return res.status(404).json({
          message: "No valid CPI rate found",
        });
      }

      // -----------------------------
      // 7. Return only what frontend needs
      // -----------------------------
      return res.json({
        cpi: bestRate.cpi,
      });

    } catch (err) {
      console.error("CALCULATE CPI ERROR:", err);

      return res.status(500).json({
        message: "Failed to calculate CPI",
      });
    }
  }
);

// router.post(
//   "/:projectId/target-groups",
//   authMiddleware,
//   businessOnly,
//   async (req, res) => {
//     const userId = req.user._id || req.user.id || req.user.userId;

//     // const project =
//     //   await Project.findById(
//     //     req.params.projectId
//     //   );

//     if (!userId) {
//         return res.status(401).json({
//           message: "User not found in authentication token",
//         });
//       }
      
//       const project = await Project.findOne({
//         _id: req.params.projectId,
//         business: userId,
//       });

//       if (!project) {
//   return res.status(404).json({
//     message: "Project not found",
//   });
// }


//     project.targetGroups.push({
//        ...req.body,
//       name:
//         `Target Group ${
//           project.targetGroups.length + 1
//         }`,

//       status: "DRAFT",
//     });

//     await project.save();

//     res.json(
//       project.targetGroups[
//         project.targetGroups.length - 1
//       ]
//     );
//   }
// );

// router.put(
//   "/:projectId/target-group/:targetGroupId",
//   authMiddleware, businessOnly,
//   async (req, res) => {
//     const {
//   market,
//   language,
//   targetCompletes,
//   loi,
//   incidence,
//   ageFrom,
//   ageTo,
//   gender,
//   devices,
//   advancedCalendar
// } = req.body;
//     // console.log("BODY:", req.body);

//     // const project = await Project.findById(
//     //   req.params.projectId
//     // );
//     const userId = req.user._id || req.user.id || req.user.userId;

//      const project = await Project.findOne({
//         _id: req.params.projectId,
//         business: userId,
//       });
//       if (!project) {
//   return res.status(404).json({
//     message: "Project not found",
//   });
// }
//     const group =
//       project.targetGroups.id(
//         req.params.targetGroupId
//       );
// if (!group) {
//   return res.status(404).json({
//     message: "Target group not found",
//   });
// }
//     // Object.assign(group, req.body);
//     Object.assign(group, {
//   market,
//   language,
//   targetCompletes,
//   loi,
//   incidence,
//   ageFrom,
//   ageTo,
//   gender,
//   devices,
//   advancedCalendar
// });

//     await project.save();

//     res.json(group);
//   }
// );

// router.get(
//   "/:projectId/target-group/:targetGroupId",
//   authMiddleware, businessOnly,
//   async (req, res) => {

//     // const project =
//     //   await Project.findById(
//     //     req.params.projectId
//     //   );

//     const userId = req.user._id || req.user.id || req.user.userId;

//      const project = await Project.findOne({
//         _id: req.params.projectId,
//         business: userId,
//       });
    
//       if (!project) {
//   return res.status(404).json({
//     message: "Project not found",
//   });
// }
//     const group =
//       project.targetGroups.id(
//         req.params.targetGroupId
//       );

//     if (!group) {
//       return res
//         .status(404)
//         .json({
//           message:
//             "Target group not found",
//         });
//     }

//     res.json(group);
//   }
// );

router.post(
  "/:projectId/target-groups",
  authMiddleware,
  businessOnly,
  async (req, res) => {
    try {
      const userId =
        req.user._id ||
        req.user.id ||
        req.user.userId;

      if (!userId) {
        return res.status(401).json({
          message: "User not found in authentication token",
        });
      }

      // 🔐 Business can only access its own project
      const project = await Project.findOne({
        _id: req.params.projectId,
        business: userId,
      });

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      // 🔐 Only accept fields that the frontend is allowed to send
      const {
        market,
        language,
        targetCompletes,
        loi,
        incidence,
        ageFrom,
        ageTo,
        gender,
        devices,
        advancedCalendar,
      } = req.body;

      // Validation
      if (
        targetCompletes !== undefined &&
        targetCompletes !== "" &&
        (!Number.isFinite(Number(targetCompletes)) ||
          Number(targetCompletes) <= 0)
      ) {
        return res.status(400).json({
          message: "Invalid target completes",
        });
      }

      if (
        loi !== undefined &&
        loi !== "" &&
        (!Number.isFinite(Number(loi)) ||
          Number(loi) <= 0)
      ) {
        return res.status(400).json({
          message: "Invalid LOI",
        });
      }

      if (
        incidence !== undefined &&
        incidence !== "" &&
        (!Number.isFinite(Number(incidence)) ||
          Number(incidence) < 0 ||
          Number(incidence) > 100)
      ) {
        return res.status(400).json({
          message: "Invalid incidence rate",
        });
      }

      if (
        ageFrom !== undefined &&
        ageFrom !== "" &&
        (!Number.isFinite(Number(ageFrom)) ||
          Number(ageFrom) < 0)
      ) {
        return res.status(400).json({
          message: "Invalid minimum age",
        });
      }

      if (
        ageTo !== undefined &&
        ageTo !== "" &&
        (!Number.isFinite(Number(ageTo)) ||
          Number(ageTo) < 0)
      ) {
        return res.status(400).json({
          message: "Invalid maximum age",
        });
      }

      if (
        ageFrom !== undefined &&
        ageFrom !== "" &&
        ageTo !== undefined &&
        ageTo !== "" &&
        Number(ageFrom) > Number(ageTo)
      ) {
        return res.status(400).json({
          message: "Minimum age cannot be greater than maximum age",
        });
      }

      // 🔐 Whitelisted data only
      const targetGroupData = {
        market,
        language,

        targetCompletes:
          targetCompletes !== undefined && targetCompletes !== ""
            ? Number(targetCompletes)
            : undefined,

        loi:
          loi !== undefined && loi !== ""
            ? Number(loi)
            : undefined,

        incidence:
          incidence !== undefined && incidence !== ""
            ? Number(incidence)
            : undefined,

        ageFrom:
          ageFrom !== undefined && ageFrom !== ""
            ? Number(ageFrom)
            : undefined,

        ageTo:
          ageTo !== undefined && ageTo !== ""
            ? Number(ageTo)
            : undefined,

        gender,
        devices,
        advancedCalendar,
      };

      // Remove undefined fields
      Object.keys(targetGroupData).forEach((key) => {
        if (targetGroupData[key] === undefined) {
          delete targetGroupData[key];
        }
      });

      // 🔐 Server controls these
      project.targetGroups.push({
        ...targetGroupData,

        name: `Target Group ${
          project.targetGroups.length + 1
        }`,

        status: "DRAFT",
      });

      await project.save();

      const group =
        project.targetGroups[
          project.targetGroups.length - 1
        ];

      // Keep your original response style
      return res.status(201).json(group);

    } catch (err) {
      console.error(
        "CREATE TARGET GROUP ERROR:",
        err
      );

      return res.status(500).json({
        message: "Failed to create target group",
      });
    }
  }
);

// router.put(
//   "/:projectId/target-group/:targetGroupId",
//   authMiddleware,
//   businessOnly,
//   async (req, res) => {
//     try {
//       const userId =
//         req.user._id ||
//         req.user.id ||
//         req.user.userId;

//       if (!userId) {
//         return res.status(401).json({
//           message: "User not found in authentication token",
//         });
//       }

//       // 🔐 Ownership check
//       const project = await Project.findOne({
//         _id: req.params.projectId,
//         business: userId,
//       });

//       if (!project) {
//         return res.status(404).json({
//           message: "Project not found",
//         });
//       }

//       const group = project.targetGroups.id(
//         req.params.targetGroupId
//       );

//       if (!group) {
//         return res.status(404).json({
//           message: "Target group not found",
//         });
//       }

//       // 🔐 Only accept allowed fields
//       const {
//         market,
//         language,
//         targetCompletes,
//         loi,
//         incidence,
//         ageFrom,
//         ageTo,
//         gender,
//         devices,
//         advancedCalendar,
//       } = req.body;

//       // --------------------------------
//       // VALIDATION
//       // --------------------------------

//       if (
//         targetCompletes !== undefined &&
//         targetCompletes !== "" &&
//         (!Number.isFinite(Number(targetCompletes)) ||
//           Number(targetCompletes) <= 0)
//       ) {
//         return res.status(400).json({
//           message: "Invalid target completes",
//         });
//       }

//       if (
//         loi !== undefined &&
//         loi !== "" &&
//         (!Number.isFinite(Number(loi)) ||
//           Number(loi) <= 0)
//       ) {
//         return res.status(400).json({
//           message: "Invalid LOI",
//         });
//       }

//       if (
//         incidence !== undefined &&
//         incidence !== "" &&
//         (!Number.isFinite(Number(incidence)) ||
//           Number(incidence) < 0 ||
//           Number(incidence) > 100)
//       ) {
//         return res.status(400).json({
//           message: "Invalid incidence rate",
//         });
//       }

//       if (
//         ageFrom !== undefined &&
//         ageFrom !== "" &&
//         (!Number.isFinite(Number(ageFrom)) ||
//           Number(ageFrom) < 0)
//       ) {
//         return res.status(400).json({
//           message: "Invalid minimum age",
//         });
//       }

//       if (
//         ageTo !== undefined &&
//         ageTo !== "" &&
//         (!Number.isFinite(Number(ageTo)) ||
//           Number(ageTo) < 0)
//       ) {
//         return res.status(400).json({
//           message: "Invalid maximum age",
//         });
//       }

//       if (
//         ageFrom !== undefined &&
//         ageFrom !== "" &&
//         ageTo !== undefined &&
//         ageTo !== "" &&
//         Number(ageFrom) > Number(ageTo)
//       ) {
//         return res.status(400).json({
//           message: "Minimum age cannot be greater than maximum age",
//         });
//       }

//       // --------------------------------
//       // UPDATE EXISTING VALUES
//       // --------------------------------

//       if (market !== undefined) {
//         group.market = market;
//       }

//       if (language !== undefined) {
//         group.language = language;
//       }

//       if (
//         targetCompletes !== undefined &&
//         targetCompletes !== ""
//       ) {
//         group.targetCompletes =
//           Number(targetCompletes);
//       }

//       if (
//         loi !== undefined &&
//         loi !== ""
//       ) {
//         group.loi = Number(loi);
//       }

//       if (
//         incidence !== undefined &&
//         incidence !== ""
//       ) {
//         group.incidence =
//           Number(incidence);
//       }

//       if (
//         ageFrom !== undefined &&
//         ageFrom !== ""
//       ) {
//         group.ageFrom =
//           Number(ageFrom);
//       }

//       if (
//         ageTo !== undefined &&
//         ageTo !== ""
//       ) {
//         group.ageTo =
//           Number(ageTo);
//       }

//       if (gender !== undefined) {
//         group.gender = gender;
//       }

//       if (devices !== undefined) {
//         group.devices = devices;
//       }

//       if (advancedCalendar !== undefined) {
//         group.advancedCalendar =
//           advancedCalendar;
//       }

//       // ❌ Never allow frontend to modify:
//       // group._id
//       // group.name
//       // group.status
//       // group.cpi
//       // group.totalCost

//       await project.save();

//       // Return the actual saved group
//       return res.json(group);

//     } catch (err) {
//       console.error(
//         "UPDATE TARGET GROUP ERROR:",
//         err
//       );

//       return res.status(500).json({
//         message: "Failed to update target group",
//       });
//     }
//   }
// );

router.put(
  "/:projectId/target-group/:targetGroupId",
  authMiddleware,
  businessOnly,
  async (req, res) => {
    try {
      const userId =
        req.user._id ||
        req.user.id ||
        req.user.userId;

      if (!userId) {
        return res.status(401).json({
          message: "User not found in authentication token",
        });
      }

      // Check project ownership
      const project = await Project.findOne({
        _id: req.params.projectId,
        business: userId,
      });

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      // Find target group
      const group = project.targetGroups.id(
        req.params.targetGroupId
      );

      if (!group) {
        return res.status(404).json({
          message: "Target group not found",
        });
      }

      const {
        market,
        language,
        targetCompletes,
        loi,
        incidence,
        ageFrom,
        ageTo,
        gender,
        devices,
        advancedCalendar,

        // These are calculated by frontend
        cpi,
        totalCost,

        sector,
        timeline,
        openEnded,
        containsPII,
        profiles,
      } = req.body;

      // -----------------------------------------
      // Validation
      // -----------------------------------------

      if (
        targetCompletes !== undefined &&
        targetCompletes !== "" &&
        (!Number.isFinite(Number(targetCompletes)) ||
          Number(targetCompletes) <= 0)
      ) {
        return res.status(400).json({
          message: "Invalid target completes",
        });
      }

      if (
        loi !== undefined &&
        loi !== "" &&
        (!Number.isFinite(Number(loi)) ||
          Number(loi) <= 0)
      ) {
        return res.status(400).json({
          message: "Invalid LOI",
        });
      }

      if (
        incidence !== undefined &&
        incidence !== "" &&
        (!Number.isFinite(Number(incidence)) ||
          Number(incidence) < 0 ||
          Number(incidence) > 100)
      ) {
        return res.status(400).json({
          message: "Invalid incidence rate",
        });
      }

      if (
        ageFrom !== undefined &&
        ageFrom !== "" &&
        (!Number.isFinite(Number(ageFrom)) ||
          Number(ageFrom) < 0)
      ) {
        return res.status(400).json({
          message: "Invalid minimum age",
        });
      }

      if (
        ageTo !== undefined &&
        ageTo !== "" &&
        (!Number.isFinite(Number(ageTo)) ||
          Number(ageTo) < 0)
      ) {
        return res.status(400).json({
          message: "Invalid maximum age",
        });
      }

      if (
        ageFrom !== undefined &&
        ageFrom !== "" &&
        ageTo !== undefined &&
        ageTo !== "" &&
        Number(ageFrom) > Number(ageTo)
      ) {
        return res.status(400).json({
          message: "Minimum age cannot be greater than maximum age",
        });
      }

      // -----------------------------------------
      // Update allowed fields
      // -----------------------------------------

      if (market !== undefined) {
        group.market = market;
      }

      if (language !== undefined) {
        group.language = language;
      }

      if (sector !== undefined) {
        group.sector = sector;
      }

      if (
        targetCompletes !== undefined &&
        targetCompletes !== ""
      ) {
        group.targetCompletes =
          Number(targetCompletes);
      }

      if (loi !== undefined && loi !== "") {
        group.loi = Number(loi);
      }

      if (
        incidence !== undefined &&
        incidence !== ""
      ) {
        group.incidence =
          Number(incidence);
      }

      if (
        ageFrom !== undefined &&
        ageFrom !== ""
      ) {
        group.ageFrom =
          Number(ageFrom);
      }

      if (
        ageTo !== undefined &&
        ageTo !== ""
      ) {
        group.ageTo =
          Number(ageTo);
      }

      if (gender !== undefined) {
        group.gender = gender;
      }

      if (devices !== undefined) {
        group.devices = devices;
      }

      if (advancedCalendar !== undefined) {
        group.advancedCalendar =
          advancedCalendar;
      }

      // -----------------------------------------
      // SAVE NEW CPI
      // -----------------------------------------

      if (
        cpi !== undefined &&
        cpi !== "" &&
        Number.isFinite(Number(cpi))
      ) {
        group.cpi = Number(cpi);
      }

      // -----------------------------------------
      // SAVE NEW TOTAL COST
      // -----------------------------------------

      if (
        totalCost !== undefined &&
        totalCost !== "" &&
        Number.isFinite(Number(totalCost))
      ) {
        group.totalCost =
          Number(totalCost);
      }

      // -----------------------------------------
      // Other fields
      // -----------------------------------------

      if (
        timeline !== undefined &&
        timeline !== ""
      ) {
        group.timeline =
          Number(timeline);
      }

      if (
        openEnded !== undefined &&
        openEnded !== ""
      ) {
        group.openEnded =
          Number(openEnded);
      }

      if (containsPII !== undefined) {
        group.containsPII = containsPII;
      }

      if (profiles !== undefined) {
        group.profiles = profiles;
      }

      // -----------------------------------------
      // IMPORTANT:
      // DO NOT update these from frontend
      // -----------------------------------------

      // group._id
      // group.name
      // group.status
      // group.completes
      // group.disqualified
      // group.quotaFull
      // group.totalResponses
      // project.business

      // -----------------------------------------
      // SAVE TO MONGODB
      // -----------------------------------------

      await project.save();

      console.log("TARGET GROUP UPDATED:", {
        id: group._id,
        market: group.market,
        targetCompletes: group.targetCompletes,
        cpi: group.cpi,
        totalCost: group.totalCost,
      });

      // -----------------------------------------
      // RETURN SAVED DATA
      // -----------------------------------------

      return res.status(200).json({
        targetGroup: {
          _id: group._id,
          name: group.name,

          market: group.market,
          language: group.language,
          sector: group.sector,

          targetCompletes:
            group.targetCompletes,

          loi: group.loi,
          incidence: group.incidence,

          ageFrom: group.ageFrom,
          ageTo: group.ageTo,

          gender: group.gender,
          devices: group.devices,

          advancedCalendar:
            group.advancedCalendar,

          cpi: group.cpi,
          totalCost: group.totalCost,

          timeline: group.timeline,
          openEnded: group.openEnded,

          containsPII:
            group.containsPII,

          profiles:
            group.profiles,

          status: group.status,
        },
      });

    } catch (err) {
      console.error(
        "UPDATE TARGET GROUP ERROR:",
        err
      );

      if (err.name === "ValidationError") {
        return res.status(400).json({
          message: "Target group validation failed",
          errors: Object.fromEntries(
            Object.entries(err.errors).map(
              ([field, error]) => [
                field,
                error.message,
              ]
            )
          ),
        });
      }

      return res.status(500).json({
        message: "Failed to update target group",
      });
    }
  }
);

router.get(
  "/:projectId/target-group/:targetGroupId",
  authMiddleware,
  businessOnly,
  async (req, res) => {
    try {
      const userId =
        req.user._id ||
        req.user.id ||
        req.user.userId;

      if (!userId) {
        return res.status(401).json({
          message: "User not found in authentication token",
        });
      }

      const project = await Project.findOne({
        _id: req.params.projectId,
        business: userId,
      });

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const group =
        project.targetGroups.id(
          req.params.targetGroupId
        );

      if (!group) {
        return res.status(404).json({
          message: "Target group not found",
        });
      }

      return res.json(group);

    } catch (err) {
      console.error(
        "GET TARGET GROUP ERROR:",
        err
      );

      return res.status(500).json({
        message: "Failed to fetch target group",
      });
    }
  }
);


export default router;