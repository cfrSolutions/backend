import crypto from "crypto";

export const hashValue = (value) => {
  if (!value) return "";

  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex");
};

export const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    ""
  );
};