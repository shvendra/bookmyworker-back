import http from "http";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";

// Routes
import dbConnection from "./database/dbConnection.js";
import jobRouter from "./routes/jobRoutes.js";
import userRouter from "./routes/userRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import otpRoute from "./routes/otpRoute.js";
import adminRouter from "./routes/adminRoute.js";
import attendanceRoute from "./routes/attendanceRoute.js";

// Middlewares
import { errorMiddleware } from "./middlewares/error.js";

// Models
import Chat from "./models/chatSchema.js";

// __dirname workaround for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize App
const app = express();
config({ path: "./config/config.env" });

// Create HTTP server & Socket.IO server
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// CORS Middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

// Core Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File Upload Middleware
app.use(fileUpload());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Use true only if HTTPS
}));
// Static File Serving for KYC and Profile Photos
app.use("/kyc_doc", express.static(path.join(__dirname, "kyc_doc")));
app.use("/profile_photo", express.static(path.join(__dirname, "profile_photo")));

// Routes
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/otp", otpRoute);
app.use("/api/v1/attendance", attendanceRoute);

// Health Check Route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is healthy",
    timestamp: new Date(),
  });
});

// Connect to MongoDB
dbConnection();

// WebSocket: Chat logic with Socket.IO
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("send_message", async (data) => {
    const { room, message, sender, role } = data;
    console.log("Received message from frontend:", data);

    try {
      let chat = await Chat.findOne({ roomId: room });
      if (!chat) {
        chat = new Chat({ roomId: room, messages: [] });
      }

      const msgObj = {
        sender,
        role,
        message,
        timestamp: new Date(),
        roomId: room, // Add this

      };

      chat.messages.push(msgObj);
      await chat.save();

      // Emit the message back to all clients in the room
      io.to(room).emit("receive_message", {
        sender,
        role,
        message,
        timestamp: new Date(),
        roomId: room, // Add this
      });    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// Global Error Middleware
app.use(errorMiddleware);

// Export the server (for use in main.js or app.js)
export default server;
