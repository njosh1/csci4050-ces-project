const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    city: {
      type: String,
      trim: true,
      maxlength: 60,
    },

    state: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 2,
    },

    zipCode: {
      type: String,
      trim: true,
      match: /^\d{5}(?:-\d{4})?$/,
    },
  },
  {
    _id: false,
  }
);

const paymentCardSchema = new mongoose.Schema(
  {
    cardholderName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    /*
     * Encrypted with backend/utils/cardEncryption.js (AES-256-GCM).
     * select: false so a normal profile fetch never pulls this back —
     * the app only ever needs the masked lastFourDigits for display.
     */
    cardNumberEncrypted: {
      type: String,
      required: true,
      select: false,
    },

    lastFourDigits: {
      type: String,
      required: true,
      match: /^\d{4}$/,
    },

    expirationMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    expirationYear: {
      type: Number,
      required: true,
    },

    billingZip: {
      type: String,
      required: true,
      match: /^\d{5}(?:-\d{4})?$/,
    },
  },
  {
    timestamps: true,
  }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["Customer", "Admin"],
      default: "Customer",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

    promotionOptIn: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      select: false,
    },

    verificationTokenExpires: {
      type: Date,
      select: false,
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordTokenExpires: {
      type: Date,
      select: false,
    },

    /*
     * Storing the address as one embedded object naturally enforces
     * the Sprint 2 rule that a customer can only have one address.
     */
    address: {
      type: addressSchema,
      default: undefined,
    },

    /*
     * Capped at 3 by application logic in profileRoutes.js — Mongoose
     * array length can't be enforced with a schema-level constraint
     * the way SQL would need a trigger for the same rule.
     */
    paymentCards: {
      type: [paymentCardSchema],
      default: [],
    },

    favorites: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Movie",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);