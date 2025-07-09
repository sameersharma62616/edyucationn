const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subject: String,
  description: String,
  videoUrl: String, // YouTube link or Cloudinary upload
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      text: String,
      commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now }
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("Lecture", lectureSchema);