const { pool } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const authService = require('../auth/auth.service');

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function normalizeNickname(nickname) {
    return String(nickname || '').trim();
}

async function assertEmailIsFreeForUser(email, userId) {
    const [rows] = await pool.execute(
        `
      SELECT id
      FROM users
      WHERE email = :email
        AND id != :userId
      LIMIT 1
    `,
        {
            email,
            userId,
        }
    );

    if (rows.length > 0) {
        throw ApiError.conflict('Пользователь с таким email уже существует.');
    }
}

async function assertNicknameIsFreeForUser(nickname, userId) {
    const [rows] = await pool.execute(
        `
      SELECT id
      FROM users
      WHERE nickname = :nickname
        AND id != :userId
      LIMIT 1
    `,
        {
            nickname,
            userId,
        }
    );

    if (rows.length > 0) {
        throw ApiError.conflict('Пользователь с таким никнеймом уже существует.');
    }
}

async function updateMe(userId, payload) {
    const nickname = normalizeNickname(payload.nickname);
    const email = normalizeEmail(payload.email);

    if (nickname.length < 3) {
        throw ApiError.badRequest('Никнейм должен содержать минимум 3 символа.');
    }

    if (nickname.length > 50) {
        throw ApiError.badRequest('Никнейм не должен быть длиннее 50 символов.');
    }

    if (!email || !email.includes('@')) {
        throw ApiError.badRequest('Введите корректный email.');
    }

    await assertEmailIsFreeForUser(email, userId);
    await assertNicknameIsFreeForUser(nickname, userId);

    await pool.execute(
        `
      UPDATE users
      SET
        nickname = :nickname,
        email = :email
      WHERE id = :userId
    `,
        {
            nickname,
            email,
            userId,
        }
    );

    const user = await authService.findUserById(userId);

    if (!user) {
        throw ApiError.notFound('Пользователь не найден.');
    }

    return authService.toPublicUser(user);
}

async function uploadAvatar(userId, file) {
    if (!file) {
        throw ApiError.badRequest('Выберите файл аватара.');
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;

    await pool.execute(
        `
      UPDATE users
      SET avatar_url = :avatarUrl
      WHERE id = :userId
    `,
        {
            avatarUrl,
            userId,
        }
    );

    return {
        avatarUrl,
    };
}

module.exports = {
    updateMe,
    uploadAvatar,
};