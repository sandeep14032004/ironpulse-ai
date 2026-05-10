const asyncHandler = require("../middlewares/asyncHandler");
const AnalyticsLog = require("../models/AnalyticsLog");
const { getDailyAnalytics, getWeeklyAnalytics, getMonthlyAnalytics } = require("../services/analyticsService");
const { buildSuccess } = require("../utils/response");
const { paginate, buildPaginationMeta } = require("../utils/pagination");

const persistLog = (userId, type, payload) => AnalyticsLog.create({ user: userId, type, payload });

const daily = asyncHandler(async (req, res) => {
  const data = await getDailyAnalytics(req.user._id);
  await persistLog(req.user._id, "daily", data);
  res.json(buildSuccess({ message: "Daily analytics fetched", data }));
});

const weekly = asyncHandler(async (req, res) => {
  const data = await getWeeklyAnalytics(req.user._id);
  await persistLog(req.user._id, "weekly", data);
  res.json(buildSuccess({ message: "Weekly analytics fetched", data }));
});

const monthly = asyncHandler(async (req, res) => {
  const data = await getMonthlyAnalytics(req.user._id);
  await persistLog(req.user._id, "monthly", data);
  res.json(buildSuccess({ message: "Monthly analytics fetched", data }));
});

const logs = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, dateFilter } = paginate(req.query);
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;
  if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;

  const [items, total] = await Promise.all([
    AnalyticsLog.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    AnalyticsLog.countDocuments(filter),
  ]);

  res.json(buildSuccess({
    message: "Analytics logs fetched",
    data: { items },
    meta: buildPaginationMeta({ total, page, limit }),
  }));
});

module.exports = { daily, weekly, monthly, logs };
