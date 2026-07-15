require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");

async function upsertDemoUser({ email, firstName, lastName, role }) {
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

  await mongoose.disconnect();
}

seedAuthDemo().catch((error) => {
  console.error(error);
  process.exit(1);
});
