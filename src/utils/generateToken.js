import jwt from "jsonwebtoken";
import crypto from "crypto";

/* =========================
   JWT LOGIN TOKEN
========================= */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d", // adjust as needed
  });
};

/* =========================
   EMAIL VERIFICATION TOKEN
========================= */
export const generateEmailToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return { token, hashedToken };
};
