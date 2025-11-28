const mongoose = require("mongoose");

const waitingRoomSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["waiting", "admitted", "left"],
      default: "waiting",
    },
    admittedAt: Date,
  },
  { timestamps: true }
);

waitingRoomSchema.index({ meeting: 1, status: 1 });

module.exports = mongoose.model("WaitingRoom", waitingRoomSchema);
