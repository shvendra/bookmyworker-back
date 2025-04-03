import express from "express";
import Chat from "../models/chatSchema.js";

const router = express.Router();

// Fetch chat history
router.get("/:roomId", async (req, res) => {
  try {
    const chat = await Chat.findOne({ roomId: req.params.roomId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }
    res.status(200).json({
      success: true,
      messages: chat.messages,
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
  try {
    let chat = await Chat.findOne({ roomId: req.params.roomId });
    if (!chat) {
      chat = new Chat({ roomId: req.params.roomId, messages: [] });
    }
    chat.messages.push({ sender, message });
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
