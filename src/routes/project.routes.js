import express from "express";
import Project from "../models/Project.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";
import CPI from "../models/CPI.model.js";

const router = express.Router();
// router.post("/create", authMiddleware, async(req, res)=>{
//       // console.log("🚀🚀🚀 NEW CREATE PROJECT CODE RUNNING 🚀🚀🚀");
//       // console.log("USER 👉", req.user);
//       const userId = req.user._id || req.user.id || req.user.userId;

// if (!userId) {
//   return res.status(401).json({ message: "User not found in token" });
// }
//     try{
//         const surveyId = "SURV-" + Date.now(); 
//         const project = await Project.create({
//             ...req.body,
//             surveyId,
//   totalResponses: 0,
//   disqualified: 0,
//   quotaFull: 0,
//             business: userId,
//         });
// //          console.log("FINAL DATA:", {
// //   ...req.body,
// //   surveyId,
// // });
//         res.json(project);
       
//     }
//     catch(err){
//         res.status(500).json({message: err.message});
//     }
// });


router.post("/create", authMiddleware, async (req, res) => {
  const userId = req.user._id || req.user.id || req.user.userId;

  try {
    const generateToken = () => crypto.randomBytes(24).toString("hex");
    
    const project = await Project.create({
      ...req.body,
       name: req.body.name,

      description:
        req.body.description || "",

      business: userId,
      status: "DRAFT",
      targetGroups: [],
      targetCompletes: req.body.targetCompletes,
      completes: 0, 
      surveyId: "SURV-" + Date.now(),

      redirects: {
        start: { token: generateToken() },
        complete: { token: generateToken() },
        disqualified: { token: generateToken() },
        quotaFull: { token: generateToken() },
      },

      disqualified: 0,
      quotaFull: 0,
      totalResponses: 0,
      business: userId,
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// router.post("/create", authMiddleware, async(req, res)=>{
//       // console.log("🚀🚀🚀 NEW CREATE PROJECT CODE RUNNING 🚀🚀🚀");
//       // console.log("USER 👉", req.user);
//       const userId = req.user._id || req.user.id || req.user.userId;

// if (!userId) {
//   return res.status(401).json({ message: "User not found in token" });
// }
//     try{
//         const surveyId = "SURV-" + Date.now(); 
//         const project = await Project.create({
//             ...req.body,
//             surveyId,
//   totalResponses: 0,
//   disqualified: 0,
//   quotaFull: 0,
//             business: userId,
//         });
// //          console.log("FINAL DATA:", {
// //   ...req.body,
// //   surveyId,
// // });
//         res.json(project);
       
//     }
//     catch(err){
//         res.status(500).json({message: err.message});
//     }
// });


router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;
    const projects = await Project.find({ business: userId });

    res.json(projects);
  } catch (err) {
    // console.log("FETCH PROJECT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/check-cpi", async (req, res) => {

  const data = await CPI.find().limit(5);

  res.json(data);

});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Not found" });
    }

    // if (project.business.toString() !== req.userId.toString()) {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/survey-links", authMiddleware, async(req, res)=>{
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
    project.surveyLinks = {test, live};
    project.status = "TESTING";
    await project.save();
    res.json({message: "Links saved successfully"});
  }
  catch(err){
    res.status(500).json({message: err.message});
  }
});

const upload = multer({ storage: multer.memoryStorage() });

router.put(
  "/:id/upload-keys",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const userId = req.user._id || req.user.id || req.user.userId;

      const project = await Project.findOne({
        _id: req.params.id,
        business: userId,
      });

      if (!project) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "client-keys",
        },
        async (error, result) => {
          if (error) {
            console.log("CLOUDINARY ERROR:", error);
            return res.status(500).json({ message: error.message });
          }

          project.clientKeysFile = result.secure_url;
          await project.save();

          res.json({
            message: "Uploaded",
            url: result.secure_url,
          });
        }
      );

      stream.end(req.file.buffer); // ✅ correct

    } catch (err) {
      console.log("UPLOAD ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ADMIN → GO LIVE
router.put("/admin/project/:id/go-live", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    project.status = "LIVE";

    await project.save();

    res.json({ message: "Project moved to LIVE" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  "/calculate-cpi",
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
  async (req, res) => {

    const project =
      await Project.findById(
        req.params.projectId
      );

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

export default router;