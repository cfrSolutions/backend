const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

export default adminOnly;
