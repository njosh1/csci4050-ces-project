const mongoose = require("mongoose");

const Movie = require("../models/movieModel");
const Reservation = require("../models/reservationModel");
const { sendOrderConfirmationEmail } = require("./emailService");

/*
 * BookingFacade is the single entry point the booking routes talk to.
 * It hides the coordination between several subsystems — the Movie
 * catalog (showtimes/showrooms), the Reservation store, seat-layout
 * rules, and outbound email — behind four operations: look up a seat
 * map, reserve seats, complete checkout (payment + email), and fetch a
 * customer's order history. Callers never touch Mongoose models or the
 * email service directly.
 */

const SHOWROOM_LAYOUTS = {
  "Showroom 1": { rows: ["A", "B", "C", "D"], seatsPerRow: 6 },
  "Showroom 2": { rows: ["A", "B", "C", "D", "E"], seatsPerRow: 8 },
  "Showroom 3": { rows: ["A", "B", "C", "D", "E", "F"], seatsPerRow: 5 },
};

const TICKET_PRICES = {
  adult: 14.99,
  child: 9.99,
  senior: 11.99,
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function seatsForShowroom(showroom) {
  const layout = SHOWROOM_LAYOUTS[showroom] || SHOWROOM_LAYOUTS["Showroom 1"];

  return layout.rows.flatMap((row) =>
    Array.from({ length: layout.seatsPerRow }, (_, index) => `${row}${index + 1}`)
  );
}

async function findMovieAndShowtime(movieId, showtimeId) {
  if (!mongoose.isValidObjectId(movieId) || !mongoose.isValidObjectId(showtimeId)) {
    return {};
  }

  const movie = await Movie.findById(movieId);
  const showtime = movie?.showtimes.id(showtimeId);
  return { movie, showtime };
}

function ticketBreakdown(tickets) {
  return (["adult", "child", "senior"])
    .filter((type) => (tickets?.[type] || 0) > 0)
    .map((type) => ({
      type,
      quantity: tickets[type],
      unitPrice: TICKET_PRICES[type],
      subtotal: Number((TICKET_PRICES[type] * tickets[type]).toFixed(2)),
    }));
}

function computeTotal(tickets) {
  return Number(
    ticketBreakdown(tickets)
      .reduce((sum, item) => sum + item.subtotal, 0)
      .toFixed(2)
  );
}

class BookingFacade {
  async getSeatMap(movieId, showtimeId) {
    const { movie, showtime } = await findMovieAndShowtime(movieId, showtimeId);

    if (!movie || !showtime) {
      throw new HttpError(404, "Movie or showtime not found.");
    }

    const reservations = await Reservation.find({
      movie: movie._id,
      showtimeId: showtime._id,
      status: { $in: ["Reserved", "Confirmed"] },
    }).select("seats -_id");

    const bookedSeats = [...new Set(reservations.flatMap((item) => item.seats))];

    return {
      movie: { id: movie._id, title: movie.title },
      showtime: {
        id: showtime._id,
        date: showtime.date,
        time: showtime.time,
        showroom: showtime.showroom,
      },
      allSeats: seatsForShowroom(showtime.showroom),
      bookedSeats,
      ticketPrices: TICKET_PRICES,
    };
  }

  async reserveSeats({ movieId, showtimeId, sessionId, tickets, seats }) {
    const { movie, showtime } = await findMovieAndShowtime(movieId, showtimeId);

    if (!movie || !showtime) {
      throw new HttpError(404, "Movie or showtime not found.");
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
      throw new HttpError(400, "Choose at least one ticket before reserving seats.");
    }

    if (ticketCount > 10) {
      throw new HttpError(400, "A maximum of 10 tickets is allowed.");
    }

    if (normalizedSeats.length !== ticketCount) {
      throw new HttpError(
        400,
        `Select exactly ${ticketCount} seat${ticketCount === 1 ? "" : "s"}.`
      );
    }

    const validSeats = seatsForShowroom(showtime.showroom);

    if (normalizedSeats.some((seat) => !validSeats.includes(seat))) {
      throw new HttpError(400, "One or more selected seats are invalid.");
    }

    const conflict = await Reservation.findOne({
      movie: movie._id,
      showtimeId: showtime._id,
      status: { $in: ["Reserved", "Confirmed"] },
      sessionId: { $ne: String(sessionId) },
      seats: { $in: normalizedSeats },
    });

    if (conflict) {
      throw new HttpError(
        409,
        "One or more seats were already reserved. Refresh and choose again."
      );
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

    return reservation;
  }

  /*
   * Marks a held reservation as paid. There's no real payment gateway
   * wired in yet, but this is where a card gets validated, the
   * reservation moves to "Confirmed" with a pricing snapshot, and the
   * order confirmation email goes out.
   */
  async completeCheckout({ movieId, showtimeId, sessionId, user, email, card }) {
    const { movie, showtime } = await findMovieAndShowtime(movieId, showtimeId);

    if (!movie || !showtime) {
      throw new HttpError(404, "Movie or showtime not found.");
    }

    const reservation = await Reservation.findOne({
      movie: movie._id,
      showtimeId: showtime._id,
      sessionId: String(sessionId),
      status: "Reserved",
    });

    if (!reservation) {
      throw new HttpError(
        404,
        "No held reservation was found for this session. Please reselect your seats."
      );
    }

    if (!card || !card.lastFourDigits) {
      throw new HttpError(400, "A payment card is required to complete checkout.");
    }

    const total = computeTotal(reservation.tickets);

    reservation.status = "Confirmed";
    reservation.user = user._id;
    reservation.email = email;
    reservation.pricePerTicket = TICKET_PRICES;
    reservation.total = total;
    reservation.confirmedAt = new Date();

    await reservation.save();

    const order = {
      reservationId: reservation._id,
      movieTitle: movie.title,
      date: showtime.date,
      time: showtime.time,
      showroom: showtime.showroom,
      seats: [...reservation.seats].sort(),
      tickets: ticketBreakdown(reservation.tickets),
      total,
      cardLastFour: card.lastFourDigits,
      confirmedAt: reservation.confirmedAt,
    };

    await sendOrderConfirmationEmail({ ...user.toObject(), email }, order);

    return order;
  }

  async getOrderHistory(userId) {
    const reservations = await Reservation.find({
      user: userId,
      status: "Confirmed",
    })
      .populate("movie")
      .sort({ confirmedAt: -1 });

    return reservations
      .filter((reservation) => reservation.movie)
      .map((reservation) => {
        const showtime = reservation.movie.showtimes.id(reservation.showtimeId);

        return {
          reservationId: reservation._id,
          movieTitle: reservation.movie.title,
          date: showtime?.date || "",
          time: showtime?.time || "",
          showroom: showtime?.showroom || "",
          seats: [...reservation.seats].sort(),
          tickets: ticketBreakdown(reservation.tickets),
          total: reservation.total,
          confirmedAt: reservation.confirmedAt,
        };
      });
  }
}

module.exports = { bookingFacade: new BookingFacade(), HttpError, TICKET_PRICES };
