const asyncHandler = require("../middlewares/asyncHandler");
const NotificationLog = require("../models/NotificationLog");
const { getMotivationalMessage } = require("../services/notificationService");
const { buildSuccess } = require("../utils/response");
const { paginate, buildPaginationMeta } = require("../utils/pagination");

const getMotivation = asyncHandler(async (req, res) => {
  const type = req.query.type || "workout-complete";
  const message = await getMotivationalMessage(req.user._id, type);
  res.json(buildSuccess({ message: "Motivation fetched", data: { message, type } }));
});

const getNotificationHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, dateFilter } = paginate(req.query);
  const filter = { user: req.user._id };
  if (Object.keys(dateFilter).length) filter.sentAt = dateFilter;

  const [items, total] = await Promise.all([
    NotificationLog.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    NotificationLog.countDocuments(filter),
  ]);

  res.json(buildSuccess({
    message: "Notification history fetched",
    data: { items },
    meta: buildPaginationMeta({ total, page, limit }),
  }));
});

module.exports = { getMotivation, getNotificationHistory };
