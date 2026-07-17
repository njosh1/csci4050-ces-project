require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
const Movie = require("./models/movieModel");
const { encryptCardNumber, lastFourDigits } = require("./utils/cardEncryption");

async function upsertDemoUser({
  email,
  firstName,
  lastName,
  role,
  favorites,
  paymentCards,
}) {
  const passwordHash = await bcrypt.hash("Cinema!2026", 12);

  await User.findOneAndUpdate(
    {
      email,
    },

    {
      firstName,
      lastName,
      email,
      passwordHash,
      role,
      status: "Active",
      promotionOptIn: false,
      favorites: favorites || [],
      paymentCards: paymentCards || [],
    },

    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  console.log(`${role} demo account created or updated.`);
  console.log(`Email: ${email}`);
  console.log("Password: Cinema!2026");
}

function demoCard(cardNumber, month, year) {
  return {
    cardholderName: "Demo Customer",
    cardNumberEncrypted: encryptCardNumber(cardNumber),
    lastFourDigits: lastFourDigits(cardNumber),
    expirationMonth: month,
    expirationYear: year,
    billingZip: "30601",
  };
}

async function seedAuthDemo() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  await upsertDemoUser({
    email: "customer.demo@ces.test",
    firstName: "Casey",
    lastName: "Customer",
    role: "Customer",
  });

  await upsertDemoUser({
    email: "admin.demo@ces.test",
    firstName: "Ada",
    lastName: "Admin",
    role: "Admin",
  });

  const anyMovie = await Movie.findOne();

  if (!anyMovie) {
    console.log(
      "No movies found — run `npm run seed` first so the favorites demo account has a movie to favorite."
    );
  } else {
    await upsertDemoUser({
      email: "favorites.demo@ces.test",
      firstName: "Fiona",
      lastName: "Favorites",
      role: "Customer",
      favorites: [anyMovie._id],
    });
  }

  await upsertDemoUser({
    email: "cards.demo@ces.test",
    firstName: "Carter",
    lastName: "Cards",
    role: "Customer",
    paymentCards: [
      demoCard("4111111111111111", 12, 2028),
      demoCard("4222222222222222", 11, 2027),
      demoCard("4333333333333333", 10, 2026),
    ],
  });

  await mongoose.disconnect();
}

seedAuthDemo().catch((error) => {
  console.error(error);
  process.exit(1);
});
