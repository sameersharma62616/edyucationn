const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { verifyToken } = require("../middleware/authMiddleware");
const Lecture = require("../models/Lecture");

// 🔍 Search teachers by name or email
router.get("/search", verifyToken, async (req, res) => {
  const { keyword } = req.query;

  try {
    const regex = new RegExp(keyword, "i"); // case-insensitive
    const teachers = await User.find({
      role: "teacher",
      $or: [{ name: regex }, { email: regex }],
    }).select("-password");

    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Error searching", error: err.message });
  }
});

// 📚 Get all teachers
router.get("/teachers", async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("name email");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 👤 Get single user (for name etc.)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// 💾 Save/Unsave a lecture
router.post("/save/:lectureId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { lectureId } = req.params;

    const alreadySaved = user.savedLectures.includes(lectureId);

    if (alreadySaved) {
      // ❌ Unsave
      user.savedLectures = user.savedLectures.filter(id => id.toString() !== lectureId);
      await user.save();
      return res.json({ message: "Lecture unsaved", saved: false });
    } else {
      // ✅ Save
      user.savedLectures.push(lectureId);
      await user.save();
      return res.json({ message: "Lecture saved", saved: true });
    }

  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// 📥 Get all saved lectures
router.get("/saved/lectures", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("savedLectures");
    res.json(user.savedLectures);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});


// ❌ DELETE teacher (admin only)
router.delete("/admin/delete/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin allowed" });
  }

  try {
    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Optionally delete their lectures as well
    await Lecture.deleteMany({ createdBy: teacher._id });

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Teacher deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting teacher", error: err.message });
  }
});

router.get("/admin/teachers/details", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin allowed" });
    }

    const teachers = await User.find({ role: "teacher" }).select("name email")
      .lean();

    for (let teacher of teachers) {
      const lectures = await Lecture.find({ createdBy: teacher._id })
        .populate("comments.commentedBy", "name")
        .lean();

      teacher.lectures = lectures;
    }

    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Update any teacher's email or password (admin only)
router.put("/admin/update-teacher/:id", verifyToken, async (req, res) => {
  const { email, password } = req.body;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin allowed" });
  }

  try {
    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (email) teacher.email = email;
    if (password) {
      const bcrypt = require("bcryptjs");
      teacher.password = await bcrypt.hash(password, 10);
    }

    await teacher.save();
    res.json({ message: "Teacher updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Admin update own profile
router.put("/admin/update-self", verifyToken, async (req, res) => {
  const { email, password } = req.body;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can access" });
  }

  try {
    const admin = await User.findById(req.user.id);

    if (email) admin.email = email;
    if (password) {
      const bcrypt = require("bcryptjs");
      admin.password = await bcrypt.hash(password, 10);
    }

    await admin.save();
    res.json({ message: "Admin updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});



module.exports = router;