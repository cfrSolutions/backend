// routes/location.routes.js
import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/reverse", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          format: "json",
          lat,
          lon,
        },
        headers: {
          "User-Agent": "survey-panel-app",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: "Location fetch failed" });
  }
});

export default router;
