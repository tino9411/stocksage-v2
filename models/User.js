// models/User.js

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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);