const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 30, // minutes
    },
    status: {
      type: String,
      enum: ["scheduled", "waiting", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    meetingLink: {
      type: String,
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Remove duplicate - unique already creates an index
    },
    notes: {
      type: String,
    },
    prescriptions: [
      {
        medication: String,
        dosage: String,
        frequency: String,
        duration: String,
      },
    ],
    recordingUrl: String,
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

// Index for quick queries
meetingSchema.index({ doctor: 1, scheduledDate: 1 });
meetingSchema.index({ patient: 1, scheduledDate: 1 });
// Removed duplicate roomId index - unique already creates one

module.exports = mongoose.model("Meeting", meetingSchema);
