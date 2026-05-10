const asyncHandler = require("../middlewares/asyncHandler");
const BodyweightEntry = require("../models/BodyweightEntry");
const { buildSuccess } = require("../utils/response");
const { paginate, buildPaginationMeta } = require("../utils/pagination");

const addBodyweight = asyncHandler(async (req, res) => {
  const { weight, date } = req.body;
  const lastEntry = await BodyweightEntry.findOne({ user: req.user._id }).sort({ date: -1 });
  const weeklyProgress = lastEntry ? Number((weight - lastEntry.weight).toFixed(2)) : 0;
  const entry = await BodyweightEntry.create({ user: req.user._id, weight, date, weeklyProgress });
  res.status(201).json(buildSuccess({ message: "Bodyweight entry added", data: { entry } }));
});

const getBodyweightHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, dateFilter } = paginate(req.query);
  const filter = { user: req.user._id };
  if (Object.keys(dateFilter).length) filter.date = dateFilter;
  const [entries, total] = await Promise.all([
    BodyweightEntry.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    BodyweightEntry.countDocuments(filter),
  ]);
  res.json(buildSuccess({
    message: "Bodyweight history fetched",
    data: { entries },
    meta: buildPaginationMeta({ total, page, limit }),
  }));
});

module.exports = { addBodyweight, getBodyweightHistory };
