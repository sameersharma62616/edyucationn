const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Playlist", playlistSchema);