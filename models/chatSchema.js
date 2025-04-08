import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: String,
  role: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  roomId: String, // Add roomId here for reference
});

const chatSchema = new mongoose.Schema({
  roomId: String,
  messages: [messageSchema],
});

export default mongoose.model("Chat", chatSchema);
