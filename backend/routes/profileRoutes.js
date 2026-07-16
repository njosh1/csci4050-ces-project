const express = require("express");
const bcrypt = require("bcryptjs");

const requireUser = require("../middleware/requireUser");
const User = require("../models/userModel");
const Movie = require("../models/movieModel");
const {
  sendProfileChangedEmail,
} = require("../services/emailService");
const {
  encryptCardNumber,
  lastFourDigits,
} = require("../utils/cardEncryption");

const MAX_PAYMENT_CARDS = 3;

const router = express.Router();

/*
 * Every route below requires an authenticated, active customer.
 */
router.use(requireUser);

function maskedCard(card) {
  return {
    id: card._id,
    cardholderName: card.cardholderName || "",
    lastFourDigits: card.lastFourDigits,
    expirationMonth: card.expirationMonth,
    expirationYear: card.expirationYear,
    billingZip: card.billingZip,
  };
}

function publicProfile(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
    promotionOptIn: Boolean(user.promotionOptIn),
    address: user.address || null,
    paymentCards: (user.paymentCards || []).map(maskedCard),
    favoriteCount: (user.favorites || []).length,
  };
}

function clean(value) {
  return String(value ?? "").trim();
}

/*
 * GET /api/profile
 *
 * Loads the current user's profile from MongoDB.
 */
router.get("/", async (req, res) => {
  return res.json(publicProfile(req.user));
});

/*
 * PUT /api/profile
 *
 * Updates personal information.
 * The email field cannot be changed.
 */
router.put("/", async (req, res, next) => {
  try {
    const firstName = clean(req.body.firstName);
    const lastName = clean(req.body.lastName);
    const phone = clean(req.body.phone);
    const promotionOptIn = Boolean(
      req.body.promotionOptIn
    );

    if (!firstName || !lastName) {
      return res.status(400).json({
        message:
          "First name and last name are required.",
      });
    }

    if (
      firstName.length > 50 ||
      lastName.length > 50
    ) {
      return res.status(400).json({
        message:
          "First name and last name cannot exceed 50 characters.",
      });
    }

    /*
     * Permits digits and common phone punctuation.
     */
    if (
      phone &&
      !/^[+()\-\.\s\d]{7,20}$/.test(phone)
    ) {
      return res.status(400).json({
        message: "Enter a valid phone number.",
      });
    }

    /*
     * Backend protection is still required even though the frontend
     * email input is disabled.
     */
    if (
      req.body.email &&
      clean(req.body.email).toLowerCase() !==
        req.user.email
    ) {
      return res.status(400).json({
        message: "Email address cannot be changed.",
      });
    }

    const changedFields = [];

    const newValues = {
      firstName,
      lastName,
      phone,
      promotionOptIn,
    };

    for (const [field, value] of Object.entries(
      newValues
    )) {
      if (req.user[field] !== value) {
        changedFields.push(field);
      }

      req.user[field] = value;
    }

    await req.user.save();

    if (changedFields.length > 0) {
      await sendProfileChangedEmail(
        req.user,
        changedFields
      );
    }

    return res.json({
      message: "Profile updated successfully.",
      profile: publicProfile(req.user),
    });
  } catch (error) {
    next(error);
  }
});

function validateAddress(body) {
  const address = {
    street: clean(body.street),
    city: clean(body.city),
    state: clean(body.state).toUpperCase(),
    zipCode: clean(body.zipCode),
  };

  if (
    !address.street ||
    !address.city ||
    !address.state ||
    !address.zipCode
  ) {
    return {
      error:
        "Street, city, state, and ZIP code are required.",
    };
  }

  if (!/^[A-Z]{2}$/.test(address.state)) {
    return {
      error:
        "State must be a two-letter abbreviation.",
    };
  }

  if (
    !/^\d{5}(?:-\d{4})?$/.test(
      address.zipCode
    )
  ) {
    return {
      error: "Enter a valid ZIP code.",
    };
  }

  return {
    address,
  };
}

/*
 * POST /api/profile/address
 *
 * Adds an address only when the user does not already have one.
 */
router.post("/address", async (req, res, next) => {
  try {
    if (req.user.address) {
      return res.status(409).json({
        message:
          "Only one address may be stored. Update or delete the current address first.",
      });
    }

    const result = validateAddress(req.body);

    if (result.error) {
      return res.status(400).json({
        message: result.error,
      });
    }

    req.user.address = result.address;

    await req.user.save();

    await sendProfileChangedEmail(req.user, [
      "address",
    ]);

    return res.status(201).json({
      message: "Address added successfully.",
      address: req.user.address,
    });
  } catch (error) {
    next(error);
  }
});

/*
 * PUT /api/profile/address
 *
 * Updates the one existing address.
 */
router.put("/address", async (req, res, next) => {
  try {
    if (!req.user.address) {
      return res.status(404).json({
        message:
          "No address exists to update.",
      });
    }

    const result = validateAddress(req.body);

    if (result.error) {
      return res.status(400).json({
        message: result.error,
      });
    }

    req.user.address = result.address;

    await req.user.save();

    await sendProfileChangedEmail(req.user, [
      "address",
    ]);

    return res.json({
      message: "Address updated successfully.",
      address: req.user.address,
    });
  } catch (error) {
    next(error);
  }
});

/*
 * DELETE /api/profile/address
 *
 * Removes the user's saved address.
 */
router.delete(
  "/address",
  async (req, res, next) => {
    try {
      if (!req.user.address) {
        return res.status(404).json({
          message:
            "No address exists to delete.",
        });
      }

      req.user.address = undefined;

      await req.user.save();

      await sendProfileChangedEmail(req.user, [
        "address removed",
      ]);

      return res.json({
        message: "Address removed successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * PUT /api/profile/password
 *
 * Requires the customer's current password before allowing
 * a password change.
 */
router.put(
  "/password",
  async (req, res, next) => {
    try {
      const currentPassword = String(
        req.body.currentPassword || ""
      );

      const newPassword = String(
        req.body.newPassword || ""
      );

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message:
            "Current password and new password are required.",
        });
      }

      const passwordIsStrong =
        newPassword.length >= 8 &&
        /[A-Z]/.test(newPassword) &&
        /[a-z]/.test(newPassword) &&
        /\d/.test(newPassword) &&
        /[^A-Za-z0-9]/.test(newPassword);

      if (!passwordIsStrong) {
        return res.status(400).json({
          message:
            "New password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.",
        });
      }

      /*
       * passwordHash is select:false in the User model, so it must
       * explicitly be selected for password comparison.
       */
      const userWithPassword =
        await User.findById(
          req.user._id
        ).select("+passwordHash");

      if (
        !userWithPassword ||
        !userWithPassword.passwordHash
      ) {
        return res.status(404).json({
          message:
            "The user password record could not be found.",
        });
      }

      const currentPasswordMatches =
        await bcrypt.compare(
          currentPassword,
          userWithPassword.passwordHash
        );

      if (!currentPasswordMatches) {
        return res.status(401).json({
          message:
            "Current password is incorrect.",
        });
      }

      const sameAsOldPassword =
        await bcrypt.compare(
          newPassword,
          userWithPassword.passwordHash
        );

      if (sameAsOldPassword) {
        return res.status(400).json({
          message:
            "New password must be different from the current password.",
        });
      }

      /*
       * Work factor 12 provides secure one-way password hashing.
       */
      userWithPassword.passwordHash =
        await bcrypt.hash(newPassword, 12);

      await userWithPassword.save();

      await sendProfileChangedEmail(req.user, [
        "password",
      ]);

      return res.json({
        message:
          "Password changed successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
);

function validateCard(body) {
  const cardholderName = clean(body.cardholderName);
  const cardNumber = clean(body.cardNumber).replace(/\s+/g, "");
  const expirationMonth = Number(body.expirationMonth);
  const expirationYear = Number(body.expirationYear);
  const billingZip = clean(body.billingZip);

  if (!cardholderName) {
    return { error: "Cardholder name is required." };
  }

  if (!/^\d{13,19}$/.test(cardNumber)) {
    return {
      error: "Card number must be 13-19 digits.",
    };
  }

  if (
    !Number.isInteger(expirationMonth) ||
    expirationMonth < 1 ||
    expirationMonth > 12
  ) {
    return { error: "Enter a valid expiration month (1-12)." };
  }

  if (!Number.isInteger(expirationYear) || expirationYear < 1000) {
    return { error: "Enter a valid expiration year." };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (
    expirationYear < currentYear ||
    (expirationYear === currentYear && expirationMonth < currentMonth)
  ) {
    return { error: "This card has already expired." };
  }

  if (!/^\d{5}(?:-\d{4})?$/.test(billingZip)) {
    return { error: "Enter a valid billing ZIP code." };
  }

  return {
    cardholderName,
    cardNumber,
    expirationMonth,
    expirationYear,
    billingZip,
  };
}

/*
 * POST /api/profile/cards
 *
 * Adds a payment card. Capped at 3 per customer — enforced here since
 * a Mongoose array length can't be capped at the schema level.
 * The raw card number is never stored: it is encrypted immediately
 * and only the last 4 digits are kept in plaintext for display.
 */
router.post("/cards", async (req, res, next) => {
  try {
    if ((req.user.paymentCards || []).length >= MAX_PAYMENT_CARDS) {
      return res.status(409).json({
        message: `Only ${MAX_PAYMENT_CARDS} payment cards may be stored. Delete a card before adding a new one.`,
      });
    }

    const result = validateCard(req.body);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    req.user.paymentCards.push({
      cardholderName: result.cardholderName,
      cardNumberEncrypted: encryptCardNumber(result.cardNumber),
      lastFourDigits: lastFourDigits(result.cardNumber),
      expirationMonth: result.expirationMonth,
      expirationYear: result.expirationYear,
      billingZip: result.billingZip,
    });

    await req.user.save();

    await sendProfileChangedEmail(req.user, ["payment card added"]);

    return res.status(201).json({
      message: "Payment card added successfully.",
      paymentCards: req.user.paymentCards.map(maskedCard),
    });
  } catch (error) {
    next(error);
  }
});

/*
 * DELETE /api/profile/cards/:cardId
 */
router.delete("/cards/:cardId", async (req, res, next) => {
  try {
    const card = req.user.paymentCards.id(req.params.cardId);

    if (!card) {
      return res.status(404).json({
        message: "Payment card not found.",
      });
    }

    card.deleteOne();

    await req.user.save();

    await sendProfileChangedEmail(req.user, ["payment card removed"]);

    return res.json({
      message: "Payment card removed successfully.",
      paymentCards: req.user.paymentCards.map(maskedCard),
    });
  } catch (error) {
    next(error);
  }
});

/*
 * GET /api/profile/favorites
 *
 * Returns the customer's favorited movies with full movie details
 * (not just ids), so the frontend can render a list directly.
 */
router.get("/favorites", async (req, res, next) => {
  try {
    const userWithFavorites = await User.findById(req.user._id).populate(
      "favorites"
    );

    return res.json({
      favorites: userWithFavorites.favorites,
    });
  } catch (error) {
    next(error);
  }
});

/*
 * POST /api/profile/favorites/:movieId
 *
 * Adds a movie to the customer's favorites. Idempotent: adding an
 * already-favorited movie is not an error.
 */
router.post("/favorites/:movieId", async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found.",
      });
    }

    const alreadyFavorited = req.user.favorites.some(
      (id) => id.toString() === movie._id.toString()
    );

    if (!alreadyFavorited) {
      req.user.favorites.push(movie._id);
      await req.user.save();
    }

    return res.status(201).json({
      message: "Added to favorites.",
      favoriteCount: req.user.favorites.length,
    });
  } catch (error) {
    next(error);
  }
});

/*
 * DELETE /api/profile/favorites/:movieId
 */
router.delete("/favorites/:movieId", async (req, res, next) => {
  try {
    const before = req.user.favorites.length;

    req.user.favorites = req.user.favorites.filter(
      (id) => id.toString() !== req.params.movieId
    );

    if (req.user.favorites.length !== before) {
      await req.user.save();
    }

    return res.json({
      message: "Removed from favorites.",
      favoriteCount: req.user.favorites.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;