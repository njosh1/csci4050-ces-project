const express = require("express");

const requireAdmin = require("../middleware/requireAdmin");
const Movie = require("../models/movieModel");
const Promotion = require("../models/promotionModel");
const User = require("../models/userModel");

const router = express.Router();

const ALLOWED_SHOWROOMS = [
  "Showroom 1",
  "Showroom 2",
  "Showroom 3",
];

/*
 * Every route below requires an authenticated Admin.
 */
router.use(requireAdmin);

/* ---------------------------------------------------------------- */
/* Movies                                                            */
/* ---------------------------------------------------------------- */

router.post("/movies", async (req, res, next) => {
  try {
    const required = [
      "title",
      "description",
      "rating",
      "status",
      "posterUrl",
      "trailerUrl",
    ];

    const missing = required.filter(
      (field) => !String(req.body[field] || "").trim()
    );

    const genre = Array.isArray(req.body.genre)
      ? req.body.genre
          .map((item) => String(item).trim())
          .filter(Boolean)
      : [];

    if (missing.length || genre.length === 0) {
      return res.status(400).json({
        message:
          "Title, description, genre, rating, status, poster URL, and trailer URL are required.",
      });
    }

    const escapedTitle = String(req.body.title)
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const duplicate = await Movie.findOne({
      title: {
        $regex: `^${escapedTitle}$`,
        $options: "i",
      },
    });

    if (duplicate) {
      return res.status(409).json({
        message: "A movie with this title already exists.",
      });
    }

    const movie = await Movie.create({
      ...req.body,
      title: String(req.body.title).trim(),
      description: String(req.body.description).trim(),
      posterUrl: String(req.body.posterUrl).trim(),
      trailerUrl: String(req.body.trailerUrl).trim(),
      genre,
    });

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
      {
        new: true,
        runValidators: true,
      }
    );

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found.",
      });
    }

    return res.json(movie);
  } catch (error) {
    next(error);
  }
});

router.delete("/movies/:id", async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(
      req.params.id
    );

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found.",
      });
    }

    return res.json({
      message: "Movie deleted.",
    });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------- */
/* Showtimes                                                         */
/* ---------------------------------------------------------------- */

router.post(
  "/movies/:id/showtimes",
  async (req, res, next) => {
    try {
      const date = String(req.body.date || "").trim();
      const time = String(req.body.time || "").trim();
      const showroom = String(
        req.body.showroom || ""
      ).trim();

      if (!date || !time || !showroom) {
        return res.status(400).json({
          message:
            "Showtime date, time, and showroom are required.",
        });
      }

      if (!ALLOWED_SHOWROOMS.includes(showroom)) {
        return res.status(400).json({
          message:
            "Showroom must be Showroom 1, Showroom 2, or Showroom 3.",
        });
      }

      const showtimeDate = new Date(`${date}T${time}`);

      if (
        Number.isNaN(showtimeDate.getTime()) ||
        showtimeDate <= new Date()
      ) {
        return res.status(400).json({
          message:
            "Showtime must be a valid future date and time.",
        });
      }

      const movie = await Movie.findById(req.params.id);

      if (!movie) {
        return res.status(404).json({
          message: "Movie not found.",
        });
      }

      const conflictingMovie = await Movie.findOne({
        showtimes: {
          $elemMatch: {
            date,
            time,
            showroom,
          },
        },
      });

      if (conflictingMovie) {
        return res.status(409).json({
          message: `${showroom} is already scheduled on ${date} at ${time}.`,
        });
      }

      movie.showtimes.push({
        date,
        time,
        showroom,
      });

      await movie.save();

      return res.status(201).json(movie);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/movies/:id/showtimes/:showtimeId",
  async (req, res, next) => {
    try {
      const movie = await Movie.findById(req.params.id);

      if (!movie) {
        return res.status(404).json({
          message: "Movie not found.",
        });
      }

      const showtime = movie.showtimes.id(
        req.params.showtimeId
      );

      if (!showtime) {
        return res.status(404).json({
          message: "Showtime not found.",
        });
      }

      showtime.deleteOne();

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
    const {
      promoCode,
      discountAmount,
      expirationDate,
    } = req.body;

    if (
      !promoCode ||
      discountAmount == null ||
      !expirationDate
    ) {
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
        message:
          "A promotion with this code already exists.",
      });
    }

    next(error);
  }
});

router.put(
  "/promotions/:id",
  async (req, res, next) => {
    try {
      const promotion =
        await Promotion.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!promotion) {
        return res.status(404).json({
          message: "Promotion not found.",
        });
      }

      return res.json(promotion);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/promotions/:id",
  async (req, res, next) => {
    try {
      const promotion =
        await Promotion.findByIdAndDelete(
          req.params.id
        );

      if (!promotion) {
        return res.status(404).json({
          message: "Promotion not found.",
        });
      }

      return res.json({
        message: "Promotion deleted.",
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ---------------------------------------------------------------- */
/* Users                                                             */
/* ---------------------------------------------------------------- */

router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find().sort({
      createdAt: -1,
    });

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

router.put(
  "/users/:id/status",
  async (req, res, next) => {
    try {
      const { status } = req.body;

      if (
        ![
          "Active",
          "Inactive",
          "Suspended",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Status must be Active, Inactive, or Suspended.",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      return res.json({
        id: user._id,
        status: user.status,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
