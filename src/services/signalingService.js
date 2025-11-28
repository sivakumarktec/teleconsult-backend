class SignalingService {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> { doctor: socketId, patient: socketId, participants: [] }
    this.setupSignaling();
  }

  setupSignaling() {
    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Join room
      socket.on("join-room", async ({ roomId, userId, role, name }) => {
        console.log(`${role} ${name} joining room ${roomId}`);

        socket.join(roomId);
        socket.userId = userId;
        socket.role = role;
        socket.roomId = roomId;

        // Initialize room if not exists
        if (!this.rooms.has(roomId)) {
          this.rooms.set(roomId, {
            doctor: null,
            patient: null,
            participants: [],
          });
        }

        const room = this.rooms.get(roomId);

        // Add participant
        room.participants.push({
          socketId: socket.id,
          userId,
          role,
          name,
        });

        if (role === "doctor") {
          room.doctor = socket.id;
        } else if (role === "patient") {
          room.patient = socket.id;
        }

        // Notify others in room
        socket.to(roomId).emit("user-joined", {
          userId,
          socketId: socket.id,
          role,
          name,
        });

        // Send existing participants to new user
        const otherParticipants = room.participants.filter(
          (p) => p.socketId !== socket.id
        );
        socket.emit("existing-participants", otherParticipants);

        console.log(
          `Room ${roomId} now has ${room.participants.length} participants`
        );
      });

      // WebRTC signaling messages
      socket.on("offer", ({ to, offer }) => {
        console.log("Sending offer from", socket.id, "to", to);
        this.io.to(to).emit("offer", {
          from: socket.id,
          offer,
        });
      });

      socket.on("answer", ({ to, answer }) => {
        console.log("Sending answer from", socket.id, "to", to);
        this.io.to(to).emit("answer", {
          from: socket.id,
          answer,
        });
      });

      socket.on("ice-candidate", ({ to, candidate }) => {
        console.log("Sending ICE candidate from", socket.id, "to", to);
        this.io.to(to).emit("ice-candidate", {
          from: socket.id,
          candidate,
        });
      });

      // Media controls
      socket.on("toggle-video", ({ roomId, enabled }) => {
        socket.to(roomId).emit("user-video-toggle", {
          userId: socket.userId,
          enabled,
        });
      });

      socket.on("toggle-audio", ({ roomId, enabled }) => {
        socket.to(roomId).emit("user-audio-toggle", {
          userId: socket.userId,
          enabled,
        });
      });

      // Screen sharing
      socket.on("start-screen-share", ({ roomId }) => {
        socket.to(roomId).emit("screen-share-started", {
          userId: socket.userId,
          socketId: socket.id,
        });
      });

      socket.on("stop-screen-share", ({ roomId }) => {
        socket.to(roomId).emit("screen-share-stopped", {
          userId: socket.userId,
        });
      });

      // Chat messages
      socket.on("chat-message", ({ roomId, message }) => {
        this.io.to(roomId).emit("chat-message", {
          userId: socket.userId,
          role: socket.role,
          message,
          timestamp: new Date(),
        });
      });

      // Leave room
      socket.on("leave-room", () => {
        this.handleUserLeave(socket);
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        this.handleUserLeave(socket);
      });
    });
  }

  handleUserLeave(socket) {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // Remove participant
    room.participants = room.participants.filter(
      (p) => p.socketId !== socket.id
    );

    // Clear role-specific slot
    if (room.doctor === socket.id) room.doctor = null;
    if (room.patient === socket.id) room.patient = null;

    // Notify others
    socket.to(roomId).emit("user-left", {
      userId: socket.userId,
      socketId: socket.id,
    });

    // Clean up empty rooms
    if (room.participants.length === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted`);
    }

    socket.leave(roomId);
  }

  getRoomInfo(roomId) {
    return this.rooms.get(roomId);
  }
}

module.exports = SignalingService;
