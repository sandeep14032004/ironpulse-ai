const express = require("express");
const { protect } = require("../middlewares/auth");
const { currentProgression } = require("../controllers/progressionController");

const router = express.Router();
router.use(protect);
router.get("/current", currentProgression);

module.exports = router;
