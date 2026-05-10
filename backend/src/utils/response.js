const buildSuccess = ({ message = "Request successful", data = {}, meta = {} }) => ({
  success: true,
  message,
  data,
  meta,
});

const buildError = ({ message = "Request failed", errors = [] }) => ({
  success: false,
  message,
  errors,
});

module.exports = { buildSuccess, buildError };
