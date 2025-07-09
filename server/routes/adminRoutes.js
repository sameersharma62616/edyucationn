const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Create a new teacher (Admin Only)
router.post("/create-teacher", verifyToken, isAdmin, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = new User({
      name,
      email,
      password: hashedPassword,
      role: "teacher",
    });

    await newTeacher.save();
    res.status(201).json({ message: "Teacher created successfully", teacher: newTeacher });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



module.exports = router;