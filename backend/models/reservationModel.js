const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    adult: { type: Number, min: 0, default: 0 },
    child: { type: Number, min: 0, default: 0 },
    senior: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    showtimeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
    },
    tickets: {
      type: ticketSchema,
      required: true,
    },
    seats: {
      type: [String],
      required: true,
      validate: {
        validator: (seats) => seats.length > 0,
        message: "At least one seat is required.",
      },
    },
    status: {
      type: String,
      enum: ["Reserved", "Confirmed"],
      default: "Reserved",
    },

    /*
     * Attached once the customer authenticates at checkout (login is
     * gated before payment) — lets a confirmed order show up in that
     * customer's order history.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    /*
     * Snapshot of pricing at confirmation time so order history stays
     * accurate even if ticket prices change later.
     */
    pricePerTicket: {
      type: ticketSchema,
      default: undefined,
    },

    total: {
      type: Number,
      min: 0,
    },

    confirmedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

reservationSchema.index({ movie: 1, showtimeId: 1, seats: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
