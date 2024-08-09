const mongoose = require('mongoose');

const ThreadSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  vectorStoreFiles: [{
    fileId: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    vectorStoreId: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Thread', ThreadSchema);