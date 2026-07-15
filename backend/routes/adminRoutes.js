const express = require("express");

const requireAdmin = require("../middleware/requireAdmin");
const Movie = require("../models/movieModel");
const Promotion = require("../models/promotionModel");
const User = require("../models/userModel");

const router = express.Router();

/*
 * Every route below requires an authenticated Admin.
 */
router.use(requireAdmin);

/* ---------------------------------------------------------------- */
/* Movies                                                            */
/* ---------------------------------------------------------------- */

router.post("/movies", async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body);

    return res.status(201).json(movie);
  } catch (error) {
    next(error);
  }
});

router.put("/movies/:id", async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    return res.json(movie);
  } catch (error) {
    next(error);
  }
});

router.delete("/movies/:id", async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    return res.json({ message: "Movie deleted." });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------- */
/* Showtimes (embedded on Movie)                                     */
/* ---------------------------------------------------------------- */

router.post("/movies/:id/showtimes", async (req, res, next) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        message: "Showtime date and time are required.",
      });
    }

    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    movie.showtimes.push({ date, time });
    await movie.save();

    return res.status(201).json(movie);
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/movies/:id/showtimes/:showtimeId",
  async (req, res, next) => {
    try {
      const movie = await Movie.findById(req.params.id);

      if (!movie) {
        return res.status(404).json({ message: "Movie not found." });
      }

      movie.showtimes.id(req.params.showtimeId)?.deleteOne();
      await movie.save();

      return res.json(movie);
    } catch (error) {
      next(error);
    }
  }
);

/* ---------------------------------------------------------------- */
/* Promotions                                                        */
/* ---------------------------------------------------------------- */

router.get("/promotions", async (req, res, next) => {
  try {
    const promotions = await Promotion.find().sort({
      createdAt: -1,
    });

    return res.json(promotions);
  } catch (error) {
    next(error);
  }
});

router.post("/promotions", async (req, res, next) => {
  try {
    const { promoCode, discountAmount, expirationDate } = req.body;

    if (!promoCode || discountAmount == null || !expirationDate) {
      return res.status(400).json({
        message:
          "Promo code, discount amount, and expiration date are required.",
      });
    }

    const promotion = await Promotion.create({
      promoCode,
      discountAmount,
      expirationDate,
    });

    return res.status(201).json(promotion);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A promotion with this code already exists.",
      });
    }

    next(error);
  }
});

router.put("/promotions/:id", async (req, res, next) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found." });
    }

    return res.json(promotion);
  } catch (error) {
    next(error);
  }
});

router.delete("/promotions/:id", async (req, res, next) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found." });
    }

    return res.json({ message: "Promotion deleted." });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------- */
/* Users                                                              */
/* ---------------------------------------------------------------- */

router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.json(
      users.map((user) => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.put("/users/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["Active", "Inactive", "Suspended"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Active, Inactive, or Suspended.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      id: user._id,
      status: user.status,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
