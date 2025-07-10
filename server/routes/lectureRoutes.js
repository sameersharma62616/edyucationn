const express = require("express");
const router = express.Router();
const Lecture = require("../models/Lecture");
const { verifyToken, isTeacher } = require("../middleware/authMiddleware");

// Create Lecture (Teacher Only)
router.post("/", verifyToken, isTeacher, async (req, res) => {
  const { title, subject, description, videoUrl } = req.body;

  try {
    const lecture = new Lecture({
      title,
      subject,
      description,
      videoUrl,
      createdBy: req.user.id,
    });

    await lecture.save();
    res.status(201).json({ message: "Lecture created", lecture });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get All Lectures (Student)
// ✅ Public route (no verifyToken middleware)
// router.get("/", async (req, res) => {
//   try {
//     const lectures = await Lecture.find().populate("createdBy", "name");
    
//     res.json(lectures);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to load lectures" });
//   }
// });

router.get("/", async (req, res) => {
  try {
    const lectures = await Lecture.find()
      .populate("createdBy", "name") // ✅ populate teacher's name
      .populate("comments.commentedBy", "name"); // ✅ populate comment user name

    res.json(lectures);
  } catch (err) {
    res.status(500).json({ error: "Failed to load lectures" });
  }
});

// Get Lectures by Teacher
router.get("/teacher/:id", verifyToken, async (req, res) => {
  const lectures = await Lecture.find({ createdBy: req.params.id });
  res.json(lectures);
});

// Edit Lecture (only by creator)
router.put("/:id", verifyToken, isTeacher, async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return res.status(404).json({ message: "Lecture not found" });

  if (lecture.createdBy.toString() !== req.user.id)
    return res.status(403).json({ message: "Not authorized" });

  const { title, subject, description, videoUrl } = req.body;
  lecture.title = title;
  lecture.subject = subject;
  lecture.description = description;
  lecture.videoUrl = videoUrl;

  await lecture.save();
  res.json({ message: "Lecture updated", lecture });
});

// Delete Lecture (only by creator)
router.delete("/:id", verifyToken, isTeacher, async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return res.status(404).json({ message: "Lecture not found" });

  if (lecture.createdBy.toString() !== req.user.id)
    return res.status(403).json({ message: "Not authorized" });

  await Lecture.findByIdAndDelete(req.params.id);
  res.json({ message: "Lecture deleted" });
});



// Like or Unlike a lecture
router.put("/like/:id", verifyToken, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) return res.status(404).json({ message: "Lecture not found" });

    const userId = req.user.id;
    const alreadyLiked = lecture.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      lecture.likes = lecture.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like
      lecture.likes.push(userId);
    }

    await lecture.save();
    res.json({ message: alreadyLiked ? "Unliked" : "Liked", likes: lecture.likes.length });

  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Add comment to lecture
router.post("/comment/:id", verifyToken, async (req, res) => {
  const { text } = req.body;

  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ message: "Lecture not found" });

    lecture.comments.push({
      text,
      commentedBy: req.user.id,
    });

    await lecture.save();

    // ✅ Populate commentedBy after saving
    const updatedLecture = await Lecture.findById(req.params.id).populate("comments.commentedBy", "name");

    res.status(201).json({ message: "Comment added", comments: updatedLecture.comments });

  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Get all comments of a lecture
router.get("/comments/:id", async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id).populate("comments.commentedBy", "name");

    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    res.json(lecture.comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// show coment by name
router.get("/comments/:id", verifyToken, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id)
      .populate("comments.commentedBy", "name");

    if (!lecture) return res.status(404).json({ message: "Lecture not found" });

    res.json(lecture.comments);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Get Lectures by Teacher
router.get("/teacher/:id", verifyToken, async (req, res) => {
  const lectures = await Lecture.find({ createdBy: req.params.id });
  res.json(lectures);
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name");
    res.json(user);
  } catch (err) {
    res.status(404).json({ message: "User not found" });
  }
});

module.exports = router;