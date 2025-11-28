const crypto = require("crypto");

exports.generateRoomId = () => {
  return crypto.randomBytes(16).toString("hex");
};

exports.generateMeetingLink = (roomId) => {
  return `${process.env.CLIENT_URL}/meeting/${roomId}`;
};
