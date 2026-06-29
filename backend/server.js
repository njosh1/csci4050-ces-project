require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Movie = require("./models/movieModel");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("CES Backend is running!");
});

// Get all movies
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ title: 1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Error getting movies", error: err });
  }
});

// Search movies by title
app.get("/api/movies/search", async (req, res) => {
  try {
    const query = req.query.q || "";

    const movies = await Movie.find({
      title: { $regex: query, $options: "i" },
    });

    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Error searching movies", error: err });
  }
});

// Filter movies by genre
app.get("/api/movies/filter", async (req, res) => {
  try {
    const genre = req.query.genre;

    if (!genre || genre === "All") {
      const movies = await Movie.find();
      return res.json(movies);
    }

    const movies = await Movie.find({
      genre: { $in: [genre] },
    });

    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Error filtering movies", error: err });
  }
});

// Get one movie by id
app.get("/api/movies/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: "Error getting movie", error: err });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});