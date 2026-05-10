const mongoose = require("mongoose");

const connectDb = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 20,
    minPoolSize: 5,
  });
};

module.exports = { connectDb };
