const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    promoCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Promotion ||
  mongoose.model("Promotion", promotionSchema);
