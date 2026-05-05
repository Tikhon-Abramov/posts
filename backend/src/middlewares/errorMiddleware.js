const multer = require('multer');

const ApiError = require('../utils/ApiError');

function errorMiddleware(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Файл слишком большой.',
        details: null,
      });
    }

    return res.status(400).json({
      message: 'Ошибка загрузки файла.',
      details: error.message,
    });
  }

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