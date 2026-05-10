const express = require("express");
const { protect } = require("../middlewares/auth");
const { daily, weekly, monthly, logs } = require("../controllers/analyticsController");

const router = express.Router();
router.use(protect);

router.get("/daily", daily);
router.get("/weekly", weekly);
router.get("/monthly", monthly);
router.get("/logs", logs);

module.exports = router;
