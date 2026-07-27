require("dotenv").config({ quiet: true });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Movie = require("./models/movieModel");
const profileRoutes = require("./routes/profileRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/profile", profileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("CES Backend is running!");
});

// Get all movies
app.get("/api/movies", async (req, res, next) => {
  try {
    const movies = await Movie.find().sort({ title: 1 });
    res.json(movies);
  } catch (err) {
    next(err);
  }
});

// Search movies by title
app.get("/api/movies/search", async (req, res, next) => {
  try {
    const query = req.query.q || "";

    const movies = await Movie.find({
      title: { $regex: query, $options: "i" },
    });

    res.json(movies);
  } catch (err) {
    next(err);
  }
});

// Filter movies by genre
app.get("/api/movies/filter", async (req, res, next) => {
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
    next(err);
  }
});

// Get one movie by id
app.get("/api/movies/:id", async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json(movie);
  } catch (err) {
    next(err);
  }
});

// Error-handling middleware must come after every route so it can
// catch anything passed to next(err), including from the routes above.
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid identifier provided." });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: "A record with that value already exists.",
    });
  }

  return res.status(500).json({
    message:
      "An unexpected server error occurred.",
  });
});

// Port 5000 is reserved by macOS AirPlay on Mac — use 5001 instead
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});