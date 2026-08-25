const mongoose = require("mongoose");

async function connectToDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn("MONGO_URI is not defined. Skipping MongoDB connection.");
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("Connected to Database");
    return true;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message || err);
    return false;
  }
}

module.exports = connectToDB;