require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/database");
const SignalingService = require("./src/services/signalingService");

const PORT = process.env.PORT || 5000;

connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Socket.IO setup
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize signaling service for WebRTC
const signalingService = new SignalingService(io);
console.log("✅ WebRTC Signaling Server initialized");

global.io = io;

// Handle server errors
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-waiting-room", (meetingId) => {
    socket.join(`waiting-${meetingId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
