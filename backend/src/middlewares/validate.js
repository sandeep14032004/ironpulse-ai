const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const normalized = errors.array().map((item) => ({
      field: item.path,
      message: item.msg,
    }));
    throw new AppError("Validation failed", 400, normalized);
  }
  next();
};

module.exports = validate;
