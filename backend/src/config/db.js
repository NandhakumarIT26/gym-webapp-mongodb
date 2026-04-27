const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_management';

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  console.log(`Connected to MongoDB: ${mongoUri}`);
};

module.exports = connectDB;
