const express = require("express");
const { protect } = require("../middlewares/auth");
const {
  getTodayWorkout,
  getWeekWorkout,
  getWorkoutByDay,
  startWorkout,
  completeSet,
  uncompleteSet,
  finishWorkout,
  getWorkoutHistory,
} = require("../controllers/workoutController");

const router = express.Router();
router.use(protect);

router.get("/today", getTodayWorkout);
router.get("/week", getWeekWorkout);
router.get("/history", getWorkoutHistory);
router.get("/:day", getWorkoutByDay);
router.post("/start", startWorkout);
router.post("/complete-set", completeSet);
router.post("/uncomplete-set", uncompleteSet);
router.post("/finish", finishWorkout);

module.exports = router;
