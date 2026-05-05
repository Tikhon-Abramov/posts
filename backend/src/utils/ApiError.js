class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Некорректный запрос', details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Необходима авторизация') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Недостаточно прав') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Ресурс не найден') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Конфликт данных') {
    return new ApiError(409, message);
  }
}

module.exports = ApiError;
