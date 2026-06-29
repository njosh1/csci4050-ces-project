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

app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ title: 1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Error getting movies", error: err });
  }
});

app.get("/api/movies/search", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (!query) {
      return res.json([]);
    }

    const words = query.split(/\s+/);

    const movies = await Movie.find({
      $and: words.map((word) => ({
        title: { $regex: word, $options: "i" },
      })),
    }).sort({ title: 1 });

    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Error searching movies", error: err });
  }
});

app.get("/api/movies/filter", async (req, res) => {
  try {
    const genre = req.query.genre;

    if (!genre || genre === "All") {
      const movies = await Movie.find().sort({ title: 1 });
      return res.json(movies);
    }

    const movies = await Movie.find({
      genre: { $in: [genre] },
    }).sort({ title: 1 });

    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Error filtering movies", error: err });
  }
});

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

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
