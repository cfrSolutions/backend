import express from "express";
import Profile from "../models/Profile.model.js";

const router = express.Router();

router.get("/", async (req, res) => {

  const profiles =
    await Profile.find();

  res.json(profiles);

});

export default router;