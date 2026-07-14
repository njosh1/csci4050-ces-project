require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");

async function seedProfileDemo() {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is missing from backend/.env"
    );
  }

  await mongoose.connect(
    process.env.MONGO_URI
  );

  const email = String(
    process.env.DEMO_USER_EMAIL ||
      "gabrielle.demo@ces.test"
  ).toLowerCase();

  const passwordHash =
    await bcrypt.hash(
      "Cinema!2026",
      12
    );

  await User.findOneAndUpdate(
    {
      email,
    },

    {
      firstName: "Gabrielle",
      lastName: "Demo",
      email,
      phone: "770-555-0199",
      passwordHash,
      role: "Customer",
      status: "Active",
      promotionOptIn: true,

      address: {
        street: "100 Cinema Way",
        city: "Cumming",
        state: "GA",
        zipCode: "30040",
      },
    },

    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  console.log(
    "Profile demo customer created or updated."
  );

  console.log(
    `Email: ${email}`
  );

  console.log(
    "Password: Cinema!2026"
  );

  await mongoose.disconnect();
}

seedProfileDemo().catch((error) => {
  console.error(error);
  process.exit(1);
});