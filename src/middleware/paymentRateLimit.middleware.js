import { rateLimit } from "express-rate-limit";

// ==========================================
// CREATE PAYMENT ORDER
// ==========================================

export const paymentOrderLimiter =
  rateLimit({
    windowMs: 60 * 1000,

    // Maximum 10 order requests
    // per IP per minute.
    limit: 10,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many payment requests. Please try again shortly.",
    },
  });


// ==========================================
// VERIFY PAYMENT
// ==========================================

export const paymentVerifyLimiter =
  rateLimit({
    windowMs: 60 * 1000,

    // Allows normal retries while limiting abuse.
    limit: 15,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many payment verification requests. Please try again shortly.",
    },
  });