const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  const uri =
    process.env.NODE_ENV === 'test' ? config.MONGO_URI_TEST : config.MONGO_URI;

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

module.exports = connectDB;
