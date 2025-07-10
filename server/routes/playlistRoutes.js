const express = require("express");
const router = express.Router();
const Playlist = require("../models/Playlist");
const { verifyToken } = require("../middleware/authMiddleware");

// Create a new playlist
router.post("/create", verifyToken, async (req, res) => {
  const { title, lectureIds } = req.body;

  try {
    const playlist = new Playlist({
      title,
      createdBy: req.user.id,
      lectures: lectureIds || [],
    });

    await playlist.save();
    res.json({ message: "Playlist created", playlist });
  } catch (err) {
    res.status(500).json({ message: "Error creating playlist", error: err.message });
  }
});

// Get all playlists of a user
// router.get("/my", verifyToken, async (req, res) => {
//   try {
//     const playlists = await Playlist.find({ createdBy: req.user.id }).populate("lectures");
//     res.json(playlists);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching playlists", error: err.message });
//   }
// });

// Get all playlists of a user
router.get("/my", verifyToken, async (req, res) => {
  try {
    const playlists = await Playlist.find({ createdBy: req.user.id })
      .populate({
        path: "lectures",
        populate: [
          { path: "createdBy", select: "name" },
          { path: "comments.commentedBy", select: "name" }
        ]
      });

    res.json(playlists);
  } catch (err) {
    res.status(500).json({ message: "Error fetching playlists", error: err.message });
  }
});

// Delete playlist
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ message: "Playlist deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting", error: err.message });
  }
});

// Add or remove lecture from playlist
router.put("/update/:id", verifyToken, async (req, res) => {
  const { lectureIds } = req.body;
  try {
    const playlist = await Playlist.findById(req.params.id);
    playlist.lectures = lectureIds;
    await playlist.save();
    res.json({ message: "Playlist updated", playlist });
  } catch (err) {
    res.status(500).json({ message: "Error updating", error: err.message });
  }
});

// 🛡 Show only user’s own playlists
router.get("/all", verifyToken, async (req, res) => {
  try {
    const playlists = await Playlist.find({ createdBy: req.user.id })
      .populate({
        path: "lectures",
        populate: {
          path: "createdBy comments.commentedBy",
          select: "name",
        },
      });

    res.json(playlists);
  } catch (err) {
    res.status(500).json({ message: "Error fetching playlists", error: err.message });
  }
});



module.exports = router;