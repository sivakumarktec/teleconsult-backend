const validateMeeting = (req, res, next) => {
  const { patientId, patientName, scheduledDate, scheduledTime } = req.body;

  if (!patientId || !patientName || !scheduledDate || !scheduledTime) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  // Validate date is in future
  const meetingDate = new Date(scheduledDate);
  if (meetingDate < new Date()) {
    return res.status(400).json({
      success: false,
      message: "Meeting date must be in the future",
    });
  }

  next();
};

const validateRegistration = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  if (
    role === "doctor" &&
    (!req.body.specialization || !req.body.licenseNumber)
  ) {
    return res.status(400).json({
      success: false,
      message: "Doctors must provide specialization and license number",
    });
  }

  next();
};

module.exports = {
  validateMeeting,
  validateRegistration,
};
