const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true }
  },
  { _id: false, timestamps: true }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String },
    messages: { type: [ChatMessageSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatSession', ChatSessionSchema);


