import express from "express";
import Profile from "../models/Profile.model.js";

const router = express.Router();

router.get("/", async (req, res) => {

  const profiles =
    await Profile.find();

  res.json(profiles);

});

router.get(
  "/profile-library",
  async (req, res) => {

    const profiles =
      await Profile.find({
        active: true
      });

    res.json(profiles);

  }
);

export default router;