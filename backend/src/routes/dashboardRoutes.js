const express = require("express");
const { protect } = require("../middlewares/auth");
const { getDashboard } = require("../controllers/dashboardController");

const router = express.Router();
router.use(protect);
router.get("/", getDashboard);

module.exports = router;
