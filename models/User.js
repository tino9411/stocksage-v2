const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
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
  password: {
    type: String,
    required: false // Changed from function() { return !this.googleId; }
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