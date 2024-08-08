// models/assistant.js
const mongoose = require('mongoose');

const AssistantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  assistantId: {
    type: String,
    required: true,
    unique: true
  },
  model: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assistant', AssistantSchema);