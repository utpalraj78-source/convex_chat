import mongoose from 'mongoose';
import { safeLog } from '../utils/logger.js';

// Pre-save middleware to log messages securely
const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  to: {
    type: mongoose.Schema.Types.Mixed, // ObjectId for private, string for group
    required: true,
    index: true
  },

  // Privacy and security fields
  isEncrypted: {
    type: Boolean,
    default: false
  },

  isPrivate: {
    type: Boolean,
    default: false
  },

  // For future features like message expiry
  expiresAt: {
    type: Date,
    default: null
  },

  // For message deletion status
  deletedFor: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }],

  type: {
    type: String,
    enum: ['text', 'voice', 'file'],
    default: 'text',
    required: true
  },

  // Text content for text messages
  text: {
    type: String,
    validate: {
      validator: function (val) {
        return this.type === 'text' ? !!val : true;
      },
      message: 'Text is required for text messages'
    }
  },

  // File/Voice message fields
  fileUrl: {
    type: String,
    validate: {
      validator: function(val) {
        return ['file', 'voice'].includes(this.type) ? !!val : true;
      },
      message: 'File URL is required for file and voice messages'
    }
  },
  fileName: {
    type: String,
    validate: {
      validator: function(val) {
        return ['file', 'voice'].includes(this.type) ? !!val : true;
      },
      message: 'File name is required for file and voice messages'
    }
  },
  fileSize: {
    type: Number,
    validate: {
      validator: function(val) {
        return ['file', 'voice'].includes(this.type) ? !!val : true;
      },
      message: 'File size is required for file and voice messages'
    }
  },

  // Voice specific fields
  audio: {
    type: String,
    validate: {
      validator: function (val) {
        return this.type === 'voice' ? !!val : true;
      },
      message: 'Audio URL is required for voice messages'
    }
  },

  duration: {
    type: Number,
    validate: {
      validator: function (val) {
        return this.type === 'voice' ? typeof val === 'number' : true;
      },
      message: 'Duration is required for voice messages'
    }
  },

  read: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
