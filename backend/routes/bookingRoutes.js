const express = require("express");
const mongoose = require("mongoose");

const Movie = require("../models/movieModel");
const Reservation = require("../models/reservationModel");

const router = express.Router();
const VALID_SEATS = ["A", "B", "C", "D"].flatMap((row) =>
  [1, 2, 3, 4, 5, 6].map((number) => `${row}${number}`)
);

async function findMovieAndShowtime(movieId, showtimeId) {
  if (!mongoose.isValidObjectId(movieId) || !mongoose.isValidObjectId(showtimeId)) {
    return {};
  }

  const movie = await Movie.findById(movieId);
  const showtime = movie?.showtimes.id(showtimeId);
  return { movie, showtime };
}

router.get("/:movieId/:showtimeId/seats", async (req, res, next) => {
  try {
    const { movie, showtime } = await findMovieAndShowtime(
      req.params.movieId,
      req.params.showtimeId
    );

    if (!movie || !showtime) {
      return res.status(404).json({ message: "Movie or showtime not found." });
    }

    const reservations = await Reservation.find({
      movie: movie._id,
      showtimeId: showtime._id,
      status: { $in: ["Reserved", "Confirmed"] },
    }).select("seats -_id");

    const bookedSeats = [...new Set(reservations.flatMap((item) => item.seats))];

    return res.json({
      movie: { id: movie._id, title: movie.title },
      showtime: {
        id: showtime._id,
        date: showtime.date,
        time: showtime.time,
        showroom: showtime.showroom,
      },
      allSeats: VALID_SEATS,
      bookedSeats,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reserve", async (req, res, next) => {
  try {
    const { movieId, showtimeId, sessionId, tickets, seats } = req.body;
    const { movie, showtime } = await findMovieAndShowtime(movieId, showtimeId);

    if (!movie || !showtime) {
      return res.status(404).json({ message: "Movie or showtime not found." });
    }

    const normalizedTickets = {
      adult: Number(tickets?.adult || 0),
      child: Number(tickets?.child || 0),
      senior: Number(tickets?.senior || 0),
    };
    const ticketCount = Object.values(normalizedTickets).reduce(
      (sum, value) => sum + value,
      0
    );
    const normalizedSeats = Array.isArray(seats)
      ? [...new Set(seats.map((seat) => String(seat).toUpperCase().trim()))]
      : [];

    if (!sessionId || ticketCount < 1) {
      return res.status(400).json({
        message: "Choose at least one ticket before reserving seats.",
      });
    }

    if (ticketCount > 10) {
      return res.status(400).json({ message: "A maximum of 10 tickets is allowed." });
    }

    if (normalizedSeats.length !== ticketCount) {
      return res.status(400).json({
        message: `Select exactly ${ticketCount} seat${ticketCount === 1 ? "" : "s"}.`,
      });
    }

    if (normalizedSeats.some((seat) => !VALID_SEATS.includes(seat))) {
      return res.status(400).json({ message: "One or more selected seats are invalid." });
    }

    const conflict = await Reservation.findOne({
      movie: movie._id,
      showtimeId: showtime._id,
      status: { $in: ["Reserved", "Confirmed"] },
      sessionId: { $ne: String(sessionId) },
      seats: { $in: normalizedSeats },
    });

    if (conflict) {
      return res.status(409).json({
        message: "One or more seats were already reserved. Refresh and choose again.",
      });
    }

    const reservation = await Reservation.findOneAndUpdate(
      {
        movie: movie._id,
        showtimeId: showtime._id,
        sessionId: String(sessionId),
        status: "Reserved",
      },
      { tickets: normalizedTickets, seats: normalizedSeats },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      message: "Seats reserved for this booking session.",
      reservationId: reservation._id,
      seats: reservation.seats,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
