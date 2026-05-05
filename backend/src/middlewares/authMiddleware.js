const jwt = require('jsonwebtoken');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const authService = require('../modules/auth/auth.service');

async function authMiddleware(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      throw ApiError.unauthorized('Необходима авторизация.');
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Некорректный токен авторизации.');
    }

    let payload;

    try {
      payload = jwt.verify(token, env.jwt.secret);
    } catch {
      throw ApiError.unauthorized('Сессия истекла или токен недействителен.');
    }

    if (!payload.userId) {
      throw ApiError.unauthorized('Некорректный токен авторизации.');
    }

    const user = await authService.findUserById(payload.userId);

    if (!user) {
      throw ApiError.unauthorized('Пользователь не найден.');
    }

    req.user = {
      id: Number(user.id),
      nickname: user.nickname,
      email: user.email,
      avatarUrl: user.avatar_url || null,
      role: user.role,
      hasPremium: Boolean(user.has_premium),
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;