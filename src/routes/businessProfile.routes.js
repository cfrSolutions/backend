import express from "express";

import {
  getBusinessProfile,
  updateBusinessProfile,
} from "../controllers/businessProfile.controller.js";
import { businessOnly } from "../middleware/business.middleware.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get logged-in business user's profile
router.get("/", authMiddleware, businessOnly, getBusinessProfile);

// Update logged-in business user's profile
router.put("/", authMiddleware, businessOnly, updateBusinessProfile);

export default router;