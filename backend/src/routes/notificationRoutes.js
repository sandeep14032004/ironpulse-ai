const express = require("express");
const { protect } = require("../middlewares/auth");
const { getMotivation, getNotificationHistory } = require("../controllers/notificationController");

const router = express.Router();
router.use(protect);

router.get("/motivation", getMotivation);
router.get("/history", getNotificationHistory);

module.exports = router;
