const ApiError = require('../utils/ApiError');

function notFoundMiddleware(req, res, next) {
  next(ApiError.notFound(`Маршрут не найден: ${req.method} ${req.originalUrl}`));
}

module.exports = notFoundMiddleware;
