import http from "http";
import { Server as SocketIOServer } from "socket.io";
import express from "express";
import dbConnection from "./database/dbConnection.js";
import jobRouter from "./routes/jobRoutes.js";
import userRouter from "./routes/userRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import { config } from "dotenv";
import chatRouter from "./routes/chatRoutes.js";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import Chat from "./models/chatSchema.js";
import mongoose from "mongoose";

const app = express();
config({ path: "./config/config.env" });

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/chat", chatRouter);
// Health Check Route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is healthy",
    timestamp: new Date(),
  });
});

// MongoDB Connection
dbConnection();

// Chat Socket.IO
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on("send_message", async (data) => {
    const { room, message, sender } = data;
    
    try {
        // Validate sender as ObjectId
        if (!mongoose.Types.ObjectId.isValid(sender)) {
            console.error("Invalid sender ID:", sender);
            return;
        }

        const senderObjectId = new mongoose.Types.ObjectId(sender);

        // Find or create chat room
        let chat = await Chat.findOne({ roomId: room });

        if (!chat) {
            chat = new Chat({ roomId: room, messages: [] });
        }

        // Push message to chat messages array
        chat.messages.push({ sender: senderObjectId, message });
        await chat.save();

        // Emit message to room (after saving to DB)
        io.to(room).emit("receive_message", { message, sender });

    } catch (error) {
        console.error("Error saving message to DB:", error);
    }
});

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

app.use(errorMiddleware);

export default server; // Export the server, not the app
