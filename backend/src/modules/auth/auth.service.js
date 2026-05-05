const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const env = require('../../config/env');
const { pool } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

const PASSWORD_MIN_LENGTH = 6;

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function normalizeNickname(nickname) {
    return String(nickname || '').trim();
}

function toPublicUser(user) {
    return {
        id: Number(user.id),
        nickname: user.nickname,
        email: user.email,
        avatarUrl: user.avatar_url || null,
        role: user.role,
        hasPremium: Boolean(user.has_premium),
    };
}

function createAccessToken(user) {
    return jwt.sign(
        {
            userId: Number(user.id),
            role: user.role,
        },
        env.jwt.secret,
        {
            expiresIn: env.jwt.expiresIn,
        }
    );
}

async function findUserById(userId) {
    const [rows] = await pool.execute(
        `
      SELECT
        id,
        nickname,
        email,
        password_hash,
        avatar_url,
        role,
        has_premium,
        created_at,
        updated_at
      FROM users
      WHERE id = :userId
      LIMIT 1
    `,
        {
            userId,
        }
    );

    return rows[0] || null;
}

async function findUserByEmail(email) {
    const [rows] = await pool.execute(
        `
      SELECT
        id,
        nickname,
        email,
        password_hash,
        avatar_url,
        role,
        has_premium,
        created_at,
        updated_at
      FROM users
      WHERE email = :email
      LIMIT 1
    `,
        {
            email,
        }
    );

    return rows[0] || null;
}

async function assertEmailIsFree(email) {
    const [rows] = await pool.execute(
        `
      SELECT id
      FROM users
      WHERE email = :email
      LIMIT 1
    `,
        {
            email,
        }
    );

    if (rows.length > 0) {
        throw ApiError.conflict('Пользователь с таким email уже существует.');
    }
}

async function assertNicknameIsFree(nickname) {
    const [rows] = await pool.execute(
        `
      SELECT id
      FROM users
      WHERE nickname = :nickname
      LIMIT 1
    `,
        {
            nickname,
        }
    );

    if (rows.length > 0) {
        throw ApiError.conflict('Пользователь с таким никнеймом уже существует.');
    }
}

function validateRegisterPayload({ nickname, email, password }) {
    const normalizedNickname = normalizeNickname(nickname);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = String(password || '');

    if (normalizedNickname.length < 3) {
        throw ApiError.badRequest('Никнейм должен содержать минимум 3 символа.');
    }

    if (normalizedNickname.length > 50) {
        throw ApiError.badRequest('Никнейм не должен быть длиннее 50 символов.');
    }

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
        throw ApiError.badRequest('Введите корректный email.');
    }

    if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
        throw ApiError.badRequest(
            `Пароль должен содержать минимум ${PASSWORD_MIN_LENGTH} символов.`
        );
    }

    return {
        nickname: normalizedNickname,
        email: normalizedEmail,
        password: normalizedPassword,
    };
}

function validateLoginPayload({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = String(password || '');

    if (!normalizedEmail || !normalizedPassword) {
        throw ApiError.badRequest('Введите email и пароль.');
    }

    return {
        email: normalizedEmail,
        password: normalizedPassword,
    };
}

async function register(payload) {
    const { nickname, email, password } = validateRegisterPayload(payload);

    await assertEmailIsFree(email);
    await assertNicknameIsFree(nickname);

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
        `
      INSERT INTO users (
        nickname,
        email,
        password_hash,
        avatar_url,
        role,
        has_premium
      )
      VALUES (
        :nickname,
        :email,
        :passwordHash,
        NULL,
        'USER',
        FALSE
      )
    `,
        {
            nickname,
            email,
            passwordHash,
        }
    );

    const user = await findUserById(result.insertId);

    return {
        user: toPublicUser(user),
        accessToken: createAccessToken(user),
    };
}

async function login(payload) {
    const { email, password } = validateLoginPayload(payload);

    const user = await findUserByEmail(email);

    if (!user) {
        throw ApiError.unauthorized('Неверный email или пароль.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
        throw ApiError.unauthorized('Неверный email или пароль.');
    }

    return {
        user: toPublicUser(user),
        accessToken: createAccessToken(user),
    };
}

async function getMe(userId) {
    const user = await findUserById(userId);

    if (!user) {
        throw ApiError.unauthorized('Пользователь не найден.');
    }

    return toPublicUser(user);
}

async function changePassword(userId, payload) {
    const currentPassword = String(payload.currentPassword || '');
    const newPassword = String(payload.newPassword || '');

    if (!currentPassword || !newPassword) {
        throw ApiError.badRequest('Введите текущий и новый пароль.');
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
        throw ApiError.badRequest(
            `Новый пароль должен содержать минимум ${PASSWORD_MIN_LENGTH} символов.`
        );
    }

    const user = await findUserById(userId);

    if (!user) {
        throw ApiError.unauthorized('Пользователь не найден.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password_hash
    );

    if (!isCurrentPasswordValid) {
        throw ApiError.badRequest('Текущий пароль указан неверно.');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await pool.execute(
        `
      UPDATE users
      SET password_hash = :newPasswordHash
      WHERE id = :userId
    `,
        {
            newPasswordHash,
            userId,
        }
    );

    return {
        message: 'Пароль изменен.',
    };
}

module.exports = {
    register,
    login,
    getMe,
    changePassword,
    findUserById,
    toPublicUser,
};