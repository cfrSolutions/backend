// middleware/business.middleware.js
export const businessOnly = (req, res, next) => {
  if (req.user.role !== "BUSINESS") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};