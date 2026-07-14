const express = require("express");
const bcrypt = require("bcryptjs");

const requireUser = require("../middleware/requireUser");
const User = require("../models/userModel");
const {
  sendProfileChangedEmail,
} = require("../services/emailService");

const router = express.Router();

/*
 * Every route below requires an authenticated, active customer.
 */
router.use(requireUser);

function publicProfile(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
    promotionOptIn: Boolean(user.promotionOptIn),
    address: user.address || null,
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

module.exports = router;