const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema({
  time: { type: String, required: true },
  date: { type: String, required: true },
});

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    genre: { type: [String], required: true },
    rating: {
      type: String,
      enum: ["G", "PG", "PG-13", "R", "NC-17"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Currently Running", "Coming Soon"],
      required: true,
    },
    posterUrl: { type: String, required: true },
    trailerUrl: { type: String, required: true },
    showtimes: { type: [showtimeSchema], default: [] },
    releaseYear: { type: Number },
    director: { type: String },
    cast: { type: [String], default: [] },
    duration: { type: Number },
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;