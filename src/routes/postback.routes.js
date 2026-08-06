import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  console.log("POSTBACK RECEIVED");
  console.log(req.query);

  res.json({
    success: true,
  });
});

export default router;