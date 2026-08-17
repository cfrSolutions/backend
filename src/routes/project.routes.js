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

      return res.status(201).json(project);

    } catch (err) {
      console.error("CREATE PROJECT ERROR:", err);

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

      const projects = await Project.find({
        business: userId,
      }).sort({
        createdAt: -1,
      });

      return res.json(projects);

    } catch (err) {
      console.error("GET BUSINESS PROJECTS ERROR:", err);

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
      });

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

router.post(
  "/calculate-cpi", authMiddleware, businessOnly,
  async (req, res) => {

    try {

      const {
        country,
        ir,
        loi,
      } = req.body;

     const rates = await CPI.find({
  country: {
    $regex: new RegExp(
      `^${country.trim()}$`,
      "i"
    ),
  },
});

      if (!rates.length) {
        return res.status(404).json({
          message: "No CPI found",
        });
      }

      let bestRate = null;
      let bestScore = Infinity;

      rates.forEach(rate => {

        const score =
          Math.abs(rate.ir - ir) +
          Math.abs(rate.loi - loi);

        if(score < bestScore){

          bestScore = score;
          bestRate = rate;

        }
      });

      res.json({
        cpi: bestRate.cpi,
      });

    } catch(err){

      console.log(err);

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

router.post(
  "/:projectId/target-groups",
  authMiddleware,
  businessOnly,
  async (req, res) => {
    const userId = req.user._id || req.user.id || req.user.userId;

    // const project =
    //   await Project.findById(
    //     req.params.projectId
    //   );

      const project = await Project.findOne({
        _id: req.params.projectId,
        business: userId,
      });

      if (!project) {
  return res.status(404).json({
    message: "Project not found",
  });
}


    project.targetGroups.push({
       ...req.body,
      name:
        `Target Group ${
          project.targetGroups.length + 1
        }`,

      status: "DRAFT",
    });

    await project.save();

    res.json(
      project.targetGroups[
        project.targetGroups.length - 1
      ]
    );
  }
);

router.put(
  "/:projectId/target-group/:targetGroupId",
  authMiddleware, businessOnly,
  async (req, res) => {
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
  advancedCalendar
} = req.body;
    // console.log("BODY:", req.body);

    // const project = await Project.findById(
    //   req.params.projectId
    // );
    const userId = req.user._id || req.user.id || req.user.userId;

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
    // Object.assign(group, req.body);
    Object.assign(group, {
  market,
  language,
  targetCompletes,
  loi,
  incidence,
  ageFrom,
  ageTo,
  gender,
  devices,
  advancedCalendar
});

    await project.save();

    res.json(group);
  }
);

router.get(
  "/:projectId/target-group/:targetGroupId",
  authMiddleware, businessOnly,
  async (req, res) => {

    // const project =
    //   await Project.findById(
    //     req.params.projectId
    //   );

    const userId = req.user._id || req.user.id || req.user.userId;

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
      return res
        .status(404)
        .json({
          message:
            "Target group not found",
        });
    }

    res.json(group);
  }
);

export default router;