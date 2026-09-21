import express from "express";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { adminDashboard } from "../controllers/admin.controller.js";
import adminOnly from "../middleware/admin.middleware.js";
import SurveyResponse from "../models/SurveyResponse.model.js";
import Survey from "../models/Survey.model.js";
import User from "../models/User.model.js";
import Project from "../models/Project.model.js";
import { generateRedirectToken  } from "../utils/generateToken.js";
const router = express.Router();
router.get(
    "/dashboard",
    authMiddleware,
    roleMiddleware(["ADMIN", "SUPERADMIN"]),
    adminDashboard
);

// router.post("/create-admin", authMiddleware, adminOnly);
router.post("/create-admin", authMiddleware, async (req, res) => {
  try {
    // only SUPERADMIN allowed
    if (req.user.role !== "SUPERADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashed,
      role: "ADMIN",
      isEmailVerified: true,
      status: "ACTIVE",
    });

    res.json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/toggle-role", authMiddleware, async (req, res) => {
  try {
    // 🔐 only superadmin allowed
    if (req.user.role !== "SUPERADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { email, isAdmin } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    // const user = await User.findOne({ email });

    // // ✅ IMPORTANT: prevent crash
    // if (!user) {
    //   return res.status(404).json({ message: "User not found" });
    // }

    let user = await User.findOne({ email });

if (!user) {
  user = await User.create({
    name: profile.displayName,
    email: profile.emails[0].value,
    isEmailVerified: true,
    status: "ACTIVE",
    referralCode: generateReferralCode(profile.displayName)
  });
}


    user.role = isAdmin ? "ADMIN" : "USER";

    await user.save();

    res.json({ message: "Role updated successfully" });

  } catch (err) {
    // console.error("TOGGLE ROLE ERROR:", err); 
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/surveys", authMiddleware, adminOnly, async (req, res) => {
  try {
    const surveys = await Survey.aggregate([
      {
        $lookup: {
          from: "surveyresponses", // 👈 Mongo collection name
          localField: "_id",
          foreignField: "survey",
          as: "responses",
        },
      },
      {
        $addFields: {
          responsesCount: { $size: "$responses" },
        },
      },
      {
        $project: {
          responses: 0, // ❌ hide full responses array
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.json(surveys);
  } catch (err) {
    // console.error(err);
    res.status(500).json({ message: "Failed to load surveys" });
  }
});

router.get(
  "/surveys/:id/responses",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const responses = await SurveyResponse.find({
        survey: req.params.id,
        status: "COMPLETED", // ✅ only completed surveys
      })
        .populate("user", "email")
        .sort({ completedAt: -1 });

      res.json(responses);
    } catch (err) {
      // console.error(err);
      res.status(500).json({ message: "Failed to load responses" });
    }
  }
);

// router.put("/project/:id/accept", authMiddleware, async (req, res) => {
//   try {
//     // 🔒 Role check
//     if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const project = await Project.findById(req.params.id);

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     // ⚠️ Already accepted
//     if (project.redirects?.complete?.token) {
//       return res.json({
//         message: "Project already accepted",
//         projectId: project._id,
//         redirects: {
//           complete: `${process.env.BACKEND_URL}/api/survey/c?tk=${project.redirects.complete.token}`,
//           disqualified: `${process.env.BACKEND_URL}/api/survey/dq?tk=${project.redirects.disqualified.token}`,
//           quotaFull: `${process.env.BACKEND_URL}/api/survey/qf?tk=${project.redirects.quotaFull.token}`,
//         },
//       });
//     }

//     // 🔥 Generate tokens
//     const completeToken = generateRedirectToken();
//     const dqToken = generateRedirectToken();
//     const quotaToken = generateRedirectToken();

//     // 🔥 Update project
//     project.status = "LIVE";

//     project.redirects = {
//       complete: { token: completeToken, url: "" },
//       disqualified: { token: dqToken, url: "" },
//       quotaFull: { token: quotaToken, url: "" },
//     };

//     await project.save();

//     // 🔥 Build URLs
//     const base = process.env.BACKEND_URL;

//     res.json({
//       message: "Project accepted successfully",
//       projectId: project._id,
//       redirects: {
//         complete: `${base}/api/survey/c?tk=${completeToken}`,
//         disqualified: `${base}/api/survey/dq?tk=${dqToken}`,
//         quotaFull: `${base}/api/survey/qf?tk=${quotaToken}`,
//       },
//     });

//   } catch (err) {
//     console.log("ADMIN ACCEPT ERROR:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

// router.put("/project/:id/accept", authMiddleware, async (req, res) => {
//   try {
//     if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const project = await Project.findById(req.params.id);

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     // 🔥 Update status ONLY if not already live
//     if (project.status !== "LIVE") {
//       project.status = "LIVE";
//       await project.save();
//     }

//     // 🔥 Always return redirects (for business panel)
//     const base = process.env.BACKEND_URL;

//     res.json({
//       message: "Project accepted",
//       projectId: project._id,
//       redirects: {
//         complete: `${base}/api/redirect/c?tk=${project.redirects.complete.token}`,
//         disqualified: `${base}/api/redirect/dq?tk=${project.redirects.disqualified.token}`,
//         quotaFull: `${base}/api/redirect/qf?tk=${project.redirects.quotaFull.token}`,
//         start: `${base}/api/redirect/start?tk=${project.redirects.complete.token}`, // 🔥 IMPORTANT
//       },
//     });

//   } catch (err) {
//     console.log("ADMIN ACCEPT ERROR:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

router.put("/project/:id/accept", authMiddleware, async (req, res) => {
  try {
    if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ✅ Only allow accept from DRAFT
    if (project.status !== "DRAFT") {
      return res.status(400).json({ message: "Already processed" });
    }
    project.status = "TESTING";
    await project.save();

    const base = process.env.BACKEND_URL;

    res.json({
      message: "Project accepted (Testing phase)",
      projectId: project._id,
      redirects: {
        start: `${base}/api/redirect/start?tk=${project.redirects.start.token}`, // ✅ FIXED
        complete: `${base}/api/redirect/c?tk=${project.redirects.complete.token}`,
        disqualified: `${base}/api/redirect/dq?tk=${project.redirects.disqualified.token}`,
        quotaFull: `${base}/api/redirect/qf?tk=${project.redirects.quotaFull.token}`,
      },
    });

  } catch (err) {
    // console.log("ADMIN ACCEPT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// router.put("/project/:id/reject", authMiddleware, async (req, res) => {
//   try {
//     if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     const project = await Project.findById(req.params.id);

//     project.status = "CLOSED";

//     await project.save();

//     res.json({ message: "Project rejected" });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });
router.put("/project/:id/reject", authMiddleware, async (req, res) => {
  try {
    if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.status !== "DRAFT") {
      return res.status(400).json({ message: "Already processed" });
    }

    project.status = "REJECTED";
    await project.save();

    res.json({ message: "Project rejected" });

  } catch (err) {
    // console.log("ADMIN REJECT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/project/:id", authMiddleware, adminOnly, async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("business", "email name");

  res.json(project);
});

router.get("/projects", authMiddleware, async (req, res) => {
  try {
    if (!["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const projects = await Project.find()
      .populate("business", "name email")
      .sort({ createdAt: -1 });

    res.json(projects);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/project/:id/move-testing", authMiddleware, adminOnly, async(req, res)=>{
  try{
    const project = await Project.findById(req.params.id);
    if(!project) return res.status(404).send("Project not found");
    project.status="TESTING";
    await project.save();
    res.send({message: "Moved to TESTING"});
  }
  catch(err){
    // console.err(err);
    res.status(500).send("Server error");
  }
});

// =====================================================
// ADMIN → TARGET GROUP MOVE TO TESTING
// =====================================================

router.put(
  "/project/:projectId/target-group/:targetGroupId/move-testing",
  authMiddleware, adminOnly,
  async (req, res) => {
    try {
      if (
        !["ADMIN", "SUPERADMIN"].includes(
          req.user.role
        )
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      const {
        projectId,
        targetGroupId,
      } = req.params;

      const project =
        await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const targetGroup =
        project.targetGroups.id(
          targetGroupId
        );

      if (!targetGroup) {
        return res.status(404).json({
          message: "Target group not found",
        });
      }

      if (targetGroup.status === "LIVE") {
        return res.status(400).json({
          message:
            "Live target groups cannot be moved back to testing",
        });
      }

      targetGroup.status = "TESTING";

      await project.save();

      return res.json({
        success: true,
        message:
          "Target group moved to TESTING",
        targetGroupId:
          targetGroup._id,
        status:
          targetGroup.status,
      });

    } catch (err) {
     

      return res.status(500).json({
        message:
          "Failed to move target group to testing",
      });
    }
  }
);

router.put("/project/:id/go-live", authMiddleware, adminOnly, async (req, res)=>{
  try{
    const project = await Project.findById(req.params.id);
    if(!project) return res.status(404).send("Project not found");
    project.status = "LIVE";
    await project.save();
    res.send({message: "Project is LIVE"});
  }
  catch(err){
    // console.log(err);
    res.status(500).send("Server error");
  }
});

// =====================================================
// ADMIN → TARGET GROUP GO LIVE
// =====================================================

router.put(
  "/project/:projectId/target-group/:targetGroupId/go-live",
  authMiddleware, adminOnly,
  async (req, res) => {
    try {
      if (
        !["ADMIN", "SUPERADMIN"].includes(
          req.user.role
        )
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      const {
        projectId,
        targetGroupId,
      } = req.params;

      const project =
        await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const targetGroup =
        project.targetGroups.id(
          targetGroupId
        );

      if (!targetGroup) {
        return res.status(404).json({
          message: "Target group not found",
        });
      }

      // -----------------------------------------
      // ONLY TESTING → LIVE
      // -----------------------------------------

      if (
        targetGroup.status !== "TESTING"
      ) {
        return res.status(400).json({
          message:
            "Only TESTING target groups can go LIVE",
        });
      }

      // -----------------------------------------
      // REQUIRE LIVE SURVEY
      // -----------------------------------------

      if (
        !targetGroup.surveyLinks?.live
      ) {
        return res.status(400).json({
          message:
            "Live survey link is required",
        });
      }

      targetGroup.status = "LIVE";

      await project.save();

      return res.json({
        success: true,

        message:
          "Target group moved to LIVE",

        targetGroupId:
          targetGroup._id,

        status:
          targetGroup.status,
      });

    } catch (err) {
      console.error(
        "TARGET GROUP GO LIVE ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to move target group live",
      });
    }
  }
);


router.put(
  "/project/:id/vendor-links",
  authMiddleware,
  async (req, res) => {
    try {

      if (
        !["ADMIN", "SUPERADMIN"]
          .includes(req.user.role)
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      const project =
        await Project.findById(
          req.params.id
        );

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const {
        vendorName,
        capture,
        complete,
        disqualified,
        quotaFull,
      } = req.body;

      project.vendorLinks = {
        vendorName,
        capture,
        complete,
        disqualified,
        quotaFull,
      };

      await project.save();

      res.json({
        success: true,
        message:
          "Vendor links saved",
      });

    } catch (err) {

      // console.log(err);

      res.status(500).json({
        message: err.message,
      });

    }
  }
);

// =====================================================
// ADMIN → TARGET GROUP VENDOR LINKS
// =====================================================

router.put(
  "/project/:projectId/target-group/:targetGroupId/vendor-links",
  authMiddleware,
  async (req, res) => {
    try {
      // -----------------------------------------
      // ROLE CHECK
      // -----------------------------------------

      if (
        !["ADMIN", "SUPERADMIN"].includes(
          req.user.role
        )
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      // -----------------------------------------
      // GET IDS
      // -----------------------------------------

      const {
        projectId,
        targetGroupId,
      } = req.params;

      // -----------------------------------------
      // FIND PROJECT
      // -----------------------------------------

      const project =
        await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      // -----------------------------------------
      // FIND TARGET GROUP
      // -----------------------------------------

      const targetGroup =
        project.targetGroups.id(
          targetGroupId
        );

      if (!targetGroup) {
        return res.status(404).json({
          message: "Target group not found",
        });
      }

      // -----------------------------------------
      // GET INPUT
      // -----------------------------------------

      const {
        vendorName,
        capture,
        complete,
        disqualified,
        quotaFull,
      } = req.body;

      // -----------------------------------------
      // SAVE
      // -----------------------------------------

      targetGroup.vendorLinks = {
        vendorName:
          String(vendorName || "").trim(),

        capture:
          String(capture || "").trim(),

        complete:
          String(complete || "").trim(),

        disqualified:
          String(disqualified || "").trim(),

        quotaFull:
          String(quotaFull || "").trim(),
      };

      // -----------------------------------------
      // SAVE PROJECT
      // -----------------------------------------

      await project.save();

      // -----------------------------------------
      // RESPONSE
      // -----------------------------------------

      return res.json({
        success: true,

        message:
          "Target group vendor links saved",

        targetGroupId:
          targetGroup._id,

        vendorLinks:
          targetGroup.vendorLinks,
      });

    } catch (err) {
      console.error(
        "TARGET GROUP VENDOR LINKS ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to save target group vendor links",
      });
    }
  }
);

router.put("/project/:id/start-negotiation", authMiddleware, async (req, res) => {

  const project = await Project.findById(req.params.id);

  project.status = "NEGOTIATION";

  await project.save();

  res.json(project);

});

// router.put("/project/:id/negotiate", async (req, res) => {

//   const {
//     sender,
//     message,
//     proposedCpi,
    
//   } = req.body;

//   const project = await Project.findById(req.params.id);

//   if (!project.negotiations) {
//     project.negotiations = [];
//   }

//   project.status = "NEGOTIATION";

//   project.negotiations.push({
//     sender,
//     message,
//     proposedCpi,
//     createdAt: new Date(),
//   });

//   await project.save();

//   res.json(project);
// });

router.put(
  "/project/:id/negotiate",
  async (req, res) => {

    try {

      const { id } = req.params;

      const {
        sender,
        message,
        proposedCpi,
      } = req.body;

      const project = await Project.findById(id);

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      project.negotiations.push({
        sender,
        message,
        proposedCpi,
        createdAt: new Date(),
      });

      await project.save();

      res.json({
        success: true,
        negotiations: project.negotiations,
      });

    } catch (err) {

      // console.log(err);

      res.status(500).json({
        message: "Server Error",
      });

    }
  }
);

router.put(
  "/project/:id/accept-negotiation",
  async (req, res) => {

    try {

      const project = await Project.findById(
        req.params.id
      );

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      project.status = "ACCEPTED";

      // update final agreed amount
      project.budget = req.body.amount;

      // optional
      project.cpi = req.body.amount;

      await project.save();

      res.json(project);

    } catch (err) {

      // console.log(err);

      res.status(500).json({
        message: "Server error",
      });

    }
  }
);

export default router;