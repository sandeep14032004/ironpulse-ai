const paginate = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const sort = query.sort || "-createdAt";

  const dateFilter = {};
  if (query.from) dateFilter.$gte = new Date(query.from);
  if (query.to) dateFilter.$lte = new Date(query.to);

  return { page, limit, skip, sort, dateFilter };
};

const buildPaginationMeta = ({ total, page, limit }) => ({
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});

module.exports = { paginate, buildPaginationMeta };
