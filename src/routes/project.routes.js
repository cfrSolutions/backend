import express from "express";
import Project from "../models/Project";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();
router.post("/create", authMiddleware, async(req, res)=>{
    try{
        const project = await Project.create({
            ...req.body,
            surveyId,
            business: req.user._id,
        });
        res.json(project);
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
});

export default router;