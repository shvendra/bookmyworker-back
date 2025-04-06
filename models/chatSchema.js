import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  roomId: {
    type: String, // Or ObjectId if you're using post IDs directly
    required: true,
    unique: true
  },
  messages: [messageSchema]
});

export default mongoose.model("Chat", chatSchema);
