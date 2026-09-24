import express from "express";

import {
  createPaymentOrder,
} from "../controllers/payment.controller.js";

import {
  authMiddleware,
} from "../middleware/auth.middleware.js";

import {
  businessOnly,
} from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/invoice/:projectId/order",
  authMiddleware,
  businessOnly,
  createPaymentOrder
);

export default router;