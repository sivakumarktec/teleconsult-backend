const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const meetingController = require("../controllers/meetingController");

router.use(protect);

router
  .route("/")
  .post(authorize("doctor"), meetingController.createMeeting)
  .get(meetingController.getMeetings);

router
  .route("/:id")
  .get(meetingController.getMeetingById)
  .put(authorize("doctor"), meetingController.updateMeetingStatus)
  .delete(authorize("doctor"), meetingController.cancelMeeting);

module.exports = router;
