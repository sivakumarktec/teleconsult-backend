const Meeting = require("../models/Meeting");
const { generateRoomId, generateMeetingLink } = require("../utils/helpers");
// const notificationService = require("../services/notificationService");

exports.createMeeting = async (req, res, next) => {
  try {
    const { patientId, patientName, scheduledDate, scheduledTime, duration } =
      req.body;

    const roomId = generateRoomId();
    const meetingLink = generateMeetingLink(roomId);

    const meeting = await Meeting.create({
      doctor: req.user.id,
      patient: patientId,
      patientName,
      scheduledDate,
      scheduledTime,
      duration,
      roomId,
      meetingLink,
    });

    await meeting.populate("doctor patient", "name email");

    // Send notification to patient
    // await notificationService.sendMeetingScheduled(meeting);

    res.status(201).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMeetings = async (req, res, next) => {
  try {
    const { date, status } = req.query;

    const query = { doctor: req.user.id };
    if (date) query.scheduledDate = new Date(date);
    if (status) query.status = status;

    const meetings = await Meeting.find(query)
      .populate("patient", "name email")
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMeetingById = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate(
      "doctor patient",
      "name email specialization"
    );

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Check authorization
    if (
      meeting.doctor._id.toString() !== req.user.id &&
      meeting.patient._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this meeting",
      });
    }

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMeetingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    meeting.status = status;

    if (status === "in-progress" && !meeting.startedAt) {
      meeting.startedAt = new Date();
    }

    if (status === "completed" && !meeting.endedAt) {
      meeting.endedAt = new Date();
    }

    await meeting.save();

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    meeting.status = "cancelled";
    await meeting.save();

    // Send cancellation notification
    // await notificationService.sendMeetingCancelled(meeting);

    res.status(200).json({
      success: true,
      message: "Meeting cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};
