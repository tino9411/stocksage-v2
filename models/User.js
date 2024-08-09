const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  watchlist: [{
    type: String
  }],
  threads: [{
    type: String  // Change this to String to store OpenAI thread IDs
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);