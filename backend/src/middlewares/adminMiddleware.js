const ApiError = require('../utils/ApiError');

function adminMiddleware(req, res, next) {
  if (!req.user) {
    return next(ApiError.unauthorized('Необходима авторизация.'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(ApiError.forbidden('Доступ разрешен только администратору.'));
  }

  next();
}

module.exports = adminMiddleware;