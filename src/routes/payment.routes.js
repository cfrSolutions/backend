import express from "express";

import {
  createPaymentOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";

import {
  authMiddleware,
} from "../middleware/auth.middleware.js";

import { businessOnly } from "../middleware/business.middleware.js";

const router = express.Router();

router.post(
  "/invoice/:invoiceId/order",
  authMiddleware,
  businessOnly,
  createPaymentOrder
);

router.post(
  "/invoice/:invoiceId/verify",
  authMiddleware,
  businessOnly,
  verifyPayment
);

export default router;