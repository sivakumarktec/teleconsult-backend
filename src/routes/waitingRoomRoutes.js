const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const waitingRoomController = require("../controllers/waitingRoomController");

router.use(protect);

router.post("/join", waitingRoomController.joinWaitingRoom);
router.get("/list/:meetingId", waitingRoomController.getWaitingList);
router.put(
  "/admit/:waitingRoomId",
  authorize("doctor"),
  waitingRoomController.admitPatient
);

module.exports = router;
