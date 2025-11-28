const WaitingRoom = require("../models/WaitingRoom");
const Meeting = require("../models/Meeting");

exports.joinWaitingRoom = async (req, res, next) => {
  try {
    const { meetingId } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Get current position in queue
    const waitingCount = await WaitingRoom.countDocuments({
      meeting: meetingId,
      status: "waiting",
    });

    const waitingRoomEntry = await WaitingRoom.create({
      meeting: meetingId,
      patient: req.user.id,
      position: waitingCount + 1,
    });

    // Update meeting status
    meeting.status = "waiting";
    await meeting.save();

    // Notify doctor
    global.io.to(`doctor-${meeting.doctor}`).emit("patient-joined", {
      patient: req.user.name,
      position: waitingRoomEntry.position,
    });

    res.status(200).json({
      success: true,
      data: waitingRoomEntry,
    });
  } catch (error) {
    next(error);
  }
};

exports.getWaitingList = async (req, res, next) => {
  try {
    const { meetingId } = req.params;

    const waitingList = await WaitingRoom.find({
      meeting: meetingId,
      status: "waiting",
    })
      .populate("patient", "name email")
      .sort({ position: 1 });

    res.status(200).json({
      success: true,
      count: waitingList.length,
      data: waitingList,
    });
  } catch (error) {
    next(error);
  }
};

exports.admitPatient = async (req, res, next) => {
  try {
    const { waitingRoomId } = req.params;

    const entry = await WaitingRoom.findById(waitingRoomId);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Waiting room entry not found",
      });
    }

    entry.status = "admitted";
    entry.admittedAt = new Date();
    await entry.save();

    // Notify patient
    global.io.to(`patient-${entry.patient}`).emit("admitted", {
      message: "You have been admitted to the consultation",
    });

    res.status(200).json({
      success: true,
      message: "Patient admitted successfully",
    });
  } catch (error) {
    next(error);
  }
};
