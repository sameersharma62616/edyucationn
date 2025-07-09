const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token)
    return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

// Check if user is teacher
const isTeacher = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "Access denied. Teachers only." });
  }
  next();
};

module.exports = { verifyToken, isAdmin, isTeacher };