const express = require("express");

const requireUser = require("../middleware/requireUser");
const { bookingFacade, HttpError } = require("../services/bookingFacade");
const { encryptCardNumber, lastFourDigits } = require("../utils/cardEncryption");

const router = express.Router();

const MAX_PAYMENT_CARDS = 3;

router.get("/:movieId/:showtimeId/seats", async (req, res, next) => {
  try {
    const seatMap = await bookingFacade.getSeatMap(req.params.movieId, req.params.showtimeId);
    return res.json(seatMap);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }

    next(error);
  }
});

router.post("/reserve", async (req, res, next) => {
  try {
    const { movieId, showtimeId, sessionId, tickets, seats } = req.body;

    const reservation = await bookingFacade.reserveSeats({
      movieId,
      showtimeId,
      sessionId,
      tickets,
      seats,
    });

    return res.status(201).json({
      message: "Seats reserved for this booking session.",
      reservationId: reservation._id,
      seats: reservation.seats,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }

    next(error);
  }
});

/*
 * POST /api/bookings/checkout
 *
 * Completes a held reservation: validates/records a payment card,
 * marks the reservation Confirmed, and emails the order confirmation.
 * Requires login, matching the checkout login-gate already enforced
 * in the booking UI before this step is reachable.
 */
router.post("/checkout", requireUser, async (req, res, next) => {
  try {
    const { movieId, showtimeId, sessionId, email, cardId, card: newCard, saveCard } =
      req.body;

    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ message: "An email address is required for the order." });
    }

    let card;

    if (cardId) {
      const savedCard = req.user.paymentCards.id(cardId);

      if (!savedCard) {
        return res.status(404).json({ message: "Saved payment card not found." });
      }

      card = { lastFourDigits: savedCard.lastFourDigits };
    } else {
      const cardholderName = String(newCard?.cardholderName || "").trim();
      const cardNumber = String(newCard?.cardNumber || "").replace(/\s+/g, "");
      const expirationMonth = Number(newCard?.expirationMonth);
      const expirationYear = Number(newCard?.expirationYear);
      const billingZip = String(newCard?.billingZip || "").trim();

      if (!cardholderName) {
        return res.status(400).json({ message: "Cardholder name is required." });
      }

      if (!/^\d{13,19}$/.test(cardNumber)) {
        return res.status(400).json({ message: "Card number must be 13-19 digits." });
      }

      if (
        !Number.isInteger(expirationMonth) ||
        expirationMonth < 1 ||
        expirationMonth > 12 ||
        !Number.isInteger(expirationYear)
      ) {
        return res.status(400).json({ message: "Enter a valid card expiration date." });
      }

      const now = new Date();

      if (
        expirationYear < now.getFullYear() ||
        (expirationYear === now.getFullYear() && expirationMonth < now.getMonth() + 1)
      ) {
        return res.status(400).json({ message: "This card has already expired." });
      }

      if (!/^\d{5}(?:-\d{4})?$/.test(billingZip)) {
        return res.status(400).json({ message: "Enter a valid billing ZIP code." });
      }

      card = { lastFourDigits: lastFourDigits(cardNumber) };

      if (saveCard && req.user.paymentCards.length < MAX_PAYMENT_CARDS) {
        req.user.paymentCards.push({
          cardholderName,
          cardNumberEncrypted: encryptCardNumber(cardNumber),
          lastFourDigits: card.lastFourDigits,
          expirationMonth,
          expirationYear,
          billingZip,
        });

        await req.user.save();
      }
    }

    const order = await bookingFacade.completeCheckout({
      movieId,
      showtimeId,
      sessionId,
      user: req.user,
      email: cleanEmail,
      card,
    });

    return res.status(200).json({
      message: "Payment processed and order confirmed.",
      order,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }

    next(error);
  }
});

/*
 * GET /api/bookings/mine
 *
 * Order history for the logged-in customer.
 */
router.get("/mine", requireUser, async (req, res, next) => {
  try {
    const orders = await bookingFacade.getOrderHistory(req.user._id);
    return res.json({ orders });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
