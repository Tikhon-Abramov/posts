const { pool } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const ALLOWED_FILTERS = [
    'ALL',
    'UNREAD',
    'REQUEST_APPROVED',
    'REQUEST_REJECTED',
    'NEW_LIKE',
    'NEW_COMMENT',
];

function parseId(value, fieldName = 'id') {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw ApiError.badRequest(`Некорректный ${fieldName}.`);
    }

    return id;
}

function parseLimit(value) {
    const limit = Number(value) || DEFAULT_LIMIT;

    return Math.min(Math.max(limit, 1), MAX_LIMIT);
}

function normalizeFilter(value) {
    if (ALLOWED_FILTERS.includes(value)) {
        return value;
    }

    return 'ALL';
}

function toIsoDate(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    return new Date(value).toISOString();
}

function mapNotificationRow(row) {
    return {
        id: Number(row.id),
        type: row.type,
        title: row.title,
        text: row.text,
        isRead: Boolean(row.is_read),
        postId: row.post_id ? Number(row.post_id) : null,
        requestId: row.request_id ? Number(row.request_id) : null,
        createdAt: toIsoDate(row.created_at),
    };
}

function buildCursorCondition({ cursor, params }) {
    if (!cursor) {
        return '';
    }

    const cursorDate = new Date(cursor);

    if (Number.isNaN(cursorDate.getTime())) {
        return '';
    }

    params.cursorDate = cursorDate;

    return 'AND created_at < :cursorDate';
}

function buildAfterCondition({ after, params }) {
    if (!after) {
        return '';
    }

    const afterDate = new Date(after);

    if (Number.isNaN(afterDate.getTime())) {
        return '';
    }

    params.afterDate = afterDate;

    return 'AND created_at > :afterDate';
}

function buildFilterCondition({ filter, params }) {
    const normalizedFilter = normalizeFilter(filter);

    if (normalizedFilter === 'ALL') {
        return '';
    }

    if (normalizedFilter === 'UNREAD') {
        return 'AND is_read = FALSE';
    }

    params.filterType = normalizedFilter;

    return 'AND type = :filterType';
}

async function getNotifications({ userId, query }) {
    const limit = parseLimit(query.limit);

    const params = {
        userId,
        limit: limit + 1,
    };

    const filterCondition = buildFilterCondition({
        filter: query.filter,
        params,
    });

    const cursorCondition = buildCursorCondition({
        cursor: query.cursor,
        params,
    });

    const [rows] = await pool.execute(
        `
      SELECT
        id,
        type,
        title,
        text,
        is_read,
        post_id,
        request_id,
        created_at
      FROM notifications
      WHERE user_id = :userId
        ${filterCondition}
        ${cursorCondition}
      ORDER BY created_at DESC, id DESC
      LIMIT :limit
    `,
        params
    );

    return buildCursorResponse(rows, limit);
}

async function getNotificationsStats(userId) {
    const [rows] = await pool.execute(
        `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) AS unread,
        SUM(CASE WHEN type = 'REQUEST_APPROVED' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN type = 'REQUEST_REJECTED' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN type = 'NEW_LIKE' THEN 1 ELSE 0 END) AS likes,
        SUM(CASE WHEN type = 'NEW_COMMENT' THEN 1 ELSE 0 END) AS comments
      FROM notifications
      WHERE user_id = :userId
    `,
        {
            userId,
        }
    );

    const row = rows[0] || {};
    const likes = Number(row.likes || 0);
    const comments = Number(row.comments || 0);

    return {
        total: Number(row.total || 0),
        unread: Number(row.unread || 0),
        approved: Number(row.approved || 0),
        rejected: Number(row.rejected || 0),
        likes,
        comments,
        social: likes + comments,
    };
}

async function getLatestNotifications({ userId, query }) {
    const params = {
        userId,
        limit: 20,
    };

    const afterCondition = buildAfterCondition({
        after: query.after,
        params,
    });

    const [rows] = await pool.execute(
        `
      SELECT
        id,
        type,
        title,
        text,
        is_read,
        post_id,
        request_id,
        created_at
      FROM notifications
      WHERE user_id = :userId
        ${afterCondition}
      ORDER BY created_at DESC, id DESC
      LIMIT :limit
    `,
        params
    );

    const items = rows.map(mapNotificationRow);
    const stats = await getNotificationsStats(userId);

    return {
        items,
        hasNew: items.length > 0,
        unread: stats.unread,
    };
}

async function markAllAsRead(userId) {
    await pool.execute(
        `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = :userId
        AND is_read = FALSE
    `,
        {
            userId,
        }
    );

    return {
        message: 'Уведомления прочитаны.',
    };
}

async function deleteNotification({ userId, notificationId }) {
    const normalizedNotificationId = parseId(notificationId, 'notificationId');

    const [result] = await pool.execute(
        `
      DELETE FROM notifications
      WHERE id = :notificationId
        AND user_id = :userId
      LIMIT 1
    `,
        {
            notificationId: normalizedNotificationId,
            userId,
        }
    );

    if (result.affectedRows === 0) {
        throw ApiError.notFound('Уведомление не найдено.');
    }

    return {
        message: 'Уведомление удалено.',
    };
}

async function clearNotifications(userId) {
    await pool.execute(
        `
      DELETE FROM notifications
      WHERE user_id = :userId
    `,
        {
            userId,
        }
    );

    return {
        message: 'Уведомления очищены.',
    };
}

function buildCursorResponse(rows, limit) {
    const hasMore = rows.length > limit;
    const responseRows = hasMore ? rows.slice(0, limit) : rows;
    const items = responseRows.map(mapNotificationRow);
    const lastItem = items[items.length - 1] || null;

    return {
        items,
        notifications: items,
        nextCursor: hasMore ? lastItem?.createdAt || null : null,
        hasMore,
        page: 1,
        totalPages: 1,
    };
}

module.exports = {
    getNotifications,
    getNotificationsStats,
    getLatestNotifications,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
};