const ApiError = require('../utils/ApiError');

function errorMiddleware(error, req, res, next) {
  const isApiError = error instanceof ApiError;

  const statusCode = isApiError ? error.statusCode : 500;

  if (statusCode >= 500) {
    console.error('[server error]', error);
  }

  res.status(statusCode).json({
    message: isApiError ? error.message : 'Внутренняя ошибка сервера',
    details: isApiError ? error.details : null,
  });
}

module.exports = errorMiddleware;
