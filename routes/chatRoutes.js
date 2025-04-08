import express from "express";
import Chat from "../models/chatSchema.js";

const router = express.Router();

// Fetch chat history (sorted by timestamp)
router.get("/:roomId", async (req, res) => {
  try {
    console.log(req.params.roomId);
    const chat = await Chat.findOne({ roomId: req.params.roomId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    // Ensure messages are sorted by timestamp
    const sortedMessages = [...chat.messages].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    res.status(200).json({
      success: true,
      messages: sortedMessages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Save a new message
router.post("/:roomId", async (req, res) => {
  const { sender, message } = req.body;

  // Basic validation
  if (!sender || !message?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Sender and message are required",
    });
  }

  try {
    let chat = await Chat.findOne({ roomId: req.params.roomId });
    if (!chat) {
      chat = new Chat({ roomId: req.params.roomId, messages: [] });
    }

    chat.messages.push({
      sender,
      message,
      timestamp: new Date(), // Explicitly set timestamp
    });

    await chat.save();

    res.status(201).json({
      success: true,
      message: "Message saved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
