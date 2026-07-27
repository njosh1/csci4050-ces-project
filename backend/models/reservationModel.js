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
  },
  { timestamps: true }
);

reservationSchema.index({ movie: 1, showtimeId: 1, seats: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
