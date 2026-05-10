const express = require("express");
const { protect } = require("../middlewares/auth");
const { addBodyweight, getBodyweightHistory } = require("../controllers/bodyweightController");

const router = express.Router();
router.use(protect);

router.post("/", addBodyweight);
router.get("/history", getBodyweightHistory);

module.exports = router;
