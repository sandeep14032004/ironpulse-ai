const { eventBus, EVENTS } = require("../utils/events");
const logger = require("../utils/logger");

const registerRealtimeBridge = () => {
  eventBus.on(EVENTS.WORKOUT_PROGRESS_UPDATED, (payload) => {
    logger.info({ event: EVENTS.WORKOUT_PROGRESS_UPDATED, payload });
  });
  eventBus.on(EVENTS.WORKOUT_FINISHED, (payload) => {
    logger.info({ event: EVENTS.WORKOUT_FINISHED, payload });
  });
  eventBus.on(EVENTS.STREAK_UPDATED, (payload) => {
    logger.info({ event: EVENTS.STREAK_UPDATED, payload });
  });
};

module.exports = { registerRealtimeBridge };
