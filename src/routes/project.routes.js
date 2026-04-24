import express from "express";
import Project from "../models/Project.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/create", authMiddleware, async(req, res)=>{
      console.log("🚀🚀🚀 NEW CREATE PROJECT CODE RUNNING 🚀🚀🚀");
      console.log("USER 👉", req.user);
    try{
        const surveyId = "SURV-" + Date.now(); 
        const project = await Project.create({
            ...req.body,
            surveyId,
  totalResponses: 0,
  disqualified: 0,
  quotaFull: 0,
            business: req.user._id || req.user.id || req.user.userId,
        });
         console.log("FINAL DATA:", {
  ...req.body,
  surveyId,
});
        res.json(project);
       
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ business: req.user._id });
    res.json(projects);
  } catch (err) {
    console.log("FETCH PROJECT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;