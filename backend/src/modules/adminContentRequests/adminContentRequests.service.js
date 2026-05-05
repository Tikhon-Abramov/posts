const { pool } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

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

function normalizeSearch(value) {
    return String(value || '').trim();
}

function normalizeStatus(value) {
    if (value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED') {
        return value;
    }

    return 'ALL';
}

function normalizeMediaType(value) {
    if (value === 'IMAGE' || value === 'VIDEO') {
        return value;
    }

    return 'ALL';
}

function normalizeVisibility(value) {
    if (value === 'PREMIUM') {
        return 'PREMIUM';
    }

    return 'PUBLIC';
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

function mapContentRequestRow(row) {
    return {
        id: Number(row.id),
        userId: Number(row.user_id),
        userNickname: row.user_nickname,
        title: row.title,
        description: row.description || '',
        suggestedVisibility: row.suggested_visibility,
        mediaType: row.media_type,
        fileName: row.file_name,
        fileSize: Number(row.file_size || 0),
        fileUrl: row.file_url,
        previewUrl: row.file_url,
        status: row.status,
        createdAt: toIsoDate(row.created_at),
        reviewedAt: toIsoDate(row.reviewed_at),
        publishedPostId: row.published_post_id
            ? Number(row.published_post_id)
            : null,
    };
}

function mapPostRow(row) {
    return {
        id: Number(row.id),
        title: row.title,
        description: row.description || '',
        visibility: row.visibility,
        media: row.media_id
            ? [
                {
                    id: Number(row.media_id),
                    type: row.media_type,
                    url: row.media_url,
                },
            ]
            : [],
        author: {
            id: Number(row.author_id),
            nickname: row.author_nickname,
            avatarUrl: row.author_avatar_url || null,
        },
        likesCount: 0,
        dislikesCount: 0,
        commentsCount: 0,
        isLikedByMe: false,
        isDislikedByMe: false,
        isSavedByMe: false,
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

    return 'AND cr.created_at < :cursorDate';
}

function buildSearchCondition({ search, params }) {
    const normalizedSearch = normalizeSearch(search);

    if (!normalizedSearch) {
        return '';
    }

    params.searchLike = `%${normalizedSearch}%`;

    return `
    AND (
      cr.title LIKE :searchLike
      OR cr.description LIKE :searchLike
      OR cr.file_name LIKE :searchLike
      OR u.nickname LIKE :searchLike
      OR CAST(cr.id AS CHAR) LIKE :searchLike
    )
  `;
}

function buildStatusCondition({ status, params }) {
    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === 'ALL') {
        return '';
    }

    params.status = normalizedStatus;

    return 'AND cr.status = :status';
}

function buildMediaCondition({ mediaType, params }) {
    const normalizedMediaType = normalizeMediaType(mediaType);

    if (normalizedMediaType === 'ALL') {
        return '';
    }

    params.mediaType = normalizedMediaType;

    return 'AND cr.media_type = :mediaType';
}

async function getContentRequests({ query }) {
    const limit = parseLimit(query.limit);

    const params = {
        limit: limit + 1,
    };

    const searchCondition = buildSearchCondition({
        search: query.search,
        params,
    });

    const statusCondition = buildStatusCondition({
        status: query.status,
        params,
    });

    const mediaCondition = buildMediaCondition({
        mediaType: query.mediaType,
        params,
    });

    const cursorCondition = buildCursorCondition({
        cursor: query.cursor,
        params,
    });

    const [rows] = await pool.execute(
        `
      SELECT
        cr.id,
        cr.user_id,
        u.nickname AS user_nickname,
        cr.title,
        cr.description,
        cr.suggested_visibility,
        cr.media_type,
        cr.file_name,
        cr.file_url,
        cr.file_size,
        cr.status,
        cr.reviewed_at,
        cr.published_post_id,
        cr.created_at
      FROM content_requests cr
      INNER JOIN users u ON u.id = cr.user_id
      WHERE 1 = 1
        ${searchCondition}
        ${statusCondition}
        ${mediaCondition}
        ${cursorCondition}
      ORDER BY cr.created_at DESC, cr.id DESC
      LIMIT :limit
    `,
        params
    );

    return buildCursorResponse(rows, limit);
}

async function getContentRequestsStats() {
    const [rows] = await pool.execute(
        `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN media_type = 'IMAGE' THEN 1 ELSE 0 END) AS images_count,
        SUM(CASE WHEN media_type = 'VIDEO' THEN 1 ELSE 0 END) AS videos_count
      FROM content_requests
    `
    );

    const row = rows[0] || {};

    return {
        total: Number(row.total || 0),
        pending: Number(row.pending || 0),
        approved: Number(row.approved || 0),
        rejected: Number(row.rejected || 0),
        imagesCount: Number(row.images_count || 0),
        videosCount: Number(row.videos_count || 0),
    };
}

async function approveContentRequest({ requestId, payload }) {
    const normalizedRequestId = parseId(requestId, 'requestId');
    const visibility = normalizeVisibility(payload.visibility);

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [requestRows] = await connection.execute(
            `
        SELECT
          cr.id,
          cr.user_id,
          u.nickname AS user_nickname,
          u.avatar_url AS user_avatar_url,
          cr.title,
          cr.description,
          cr.suggested_visibility,
          cr.media_type,
          cr.file_name,
          cr.file_url,
          cr.file_size,
          cr.status,
          cr.reviewed_at,
          cr.published_post_id,
          cr.created_at
        FROM content_requests cr
        INNER JOIN users u ON u.id = cr.user_id
        WHERE cr.id = :requestId
        LIMIT 1
        FOR UPDATE
      `,
            {
                requestId: normalizedRequestId,
            }
        );

        const request = requestRows[0];

        if (!request) {
            throw ApiError.notFound('Заявка не найдена.');
        }

        if (request.status !== 'PENDING') {
            throw ApiError.badRequest('Можно одобрить только заявку на проверке.');
        }

        const [postResult] = await connection.execute(
            `
        INSERT INTO posts (
          author_id,
          title,
          description,
          visibility
        )
        VALUES (
          :authorId,
          :title,
          :description,
          :visibility
        )
      `,
            {
                authorId: request.user_id,
                title: request.title,
                description: request.description || '',
                visibility,
            }
        );

        const postId = postResult.insertId;

        const [mediaResult] = await connection.execute(
            `
        INSERT INTO post_media (
          post_id,
          type,
          url
        )
        VALUES (
          :postId,
          :type,
          :url
        )
      `,
            {
                postId,
                type: request.media_type,
                url: request.file_url,
            }
        );

        await connection.execute(
            `
        UPDATE content_requests
        SET
          status = 'APPROVED',
          suggested_visibility = :visibility,
          reviewed_at = NOW(),
          published_post_id = :postId
        WHERE id = :requestId
      `,
            {
                visibility,
                postId,
                requestId: normalizedRequestId,
            }
        );

        await connection.execute(
            `
        INSERT INTO notifications (
          user_id,
          type,
          title,
          text,
          is_read,
          post_id,
          request_id
        )
        VALUES (
          :userId,
          'REQUEST_APPROVED',
          'Публикация одобрена',
          :text,
          FALSE,
          :postId,
          :requestId
        )
      `,
            {
                userId: request.user_id,
                text:
                    visibility === 'PREMIUM'
                        ? `Ваша заявка «${request.title}» опубликована в Premium-ленте.`
                        : `Ваша заявка «${request.title}» опубликована в обычной ленте.`,
                postId,
                requestId: normalizedRequestId,
            }
        );

        await connection.commit();

        return {
            message: 'Заявка одобрена.',
            post: {
                id: Number(postId),
                title: request.title,
                description: request.description || '',
                visibility,
                media: [
                    {
                        id: Number(mediaResult.insertId),
                        type: request.media_type,
                        url: request.file_url,
                    },
                ],
                author: {
                    id: Number(request.user_id),
                    nickname: request.user_nickname,
                    avatarUrl: request.user_avatar_url || null,
                },
                likesCount: 0,
                dislikesCount: 0,
                commentsCount: 0,
                isLikedByMe: false,
                isDislikedByMe: false,
                isSavedByMe: false,
                createdAt: new Date().toISOString(),
            },
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function rejectContentRequest({ requestId }) {
    const normalizedRequestId = parseId(requestId, 'requestId');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [requestRows] = await connection.execute(
            `
        SELECT
          id,
          user_id,
          title,
          status
        FROM content_requests
        WHERE id = :requestId
        LIMIT 1
        FOR UPDATE
      `,
            {
                requestId: normalizedRequestId,
            }
        );

        const request = requestRows[0];

        if (!request) {
            throw ApiError.notFound('Заявка не найдена.');
        }

        if (request.status !== 'PENDING') {
            throw ApiError.badRequest('Можно отклонить только заявку на проверке.');
        }

        await connection.execute(
            `
        UPDATE content_requests
        SET
          status = 'REJECTED',
          reviewed_at = NOW()
        WHERE id = :requestId
      `,
            {
                requestId: normalizedRequestId,
            }
        );

        await connection.execute(
            `
        INSERT INTO notifications (
          user_id,
          type,
          title,
          text,
          is_read,
          post_id,
          request_id
        )
        VALUES (
          :userId,
          'REQUEST_REJECTED',
          'Публикация отклонена',
          :text,
          FALSE,
          NULL,
          :requestId
        )
      `,
            {
                userId: request.user_id,
                text: `Ваша заявка «${request.title}» была отклонена администратором.`,
                requestId: normalizedRequestId,
            }
        );

        await connection.commit();

        return {
            message: 'Заявка отклонена.',
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function deleteContentRequest({ requestId }) {
    const normalizedRequestId = parseId(requestId, 'requestId');

    const [result] = await pool.execute(
        `
      DELETE FROM content_requests
      WHERE id = :requestId
      LIMIT 1
    `,
        {
            requestId: normalizedRequestId,
        }
    );

    if (result.affectedRows === 0) {
        throw ApiError.notFound('Заявка не найдена.');
    }

    return {
        message: 'Заявка удалена.',
    };
}

function buildCursorResponse(rows, limit) {
    const hasMore = rows.length > limit;
    const responseRows = hasMore ? rows.slice(0, limit) : rows;
    const items = responseRows.map(mapContentRequestRow);
    const lastItem = items[items.length - 1] || null;

    return {
        items,
        requests: items,
        nextCursor: hasMore ? lastItem?.createdAt || null : null,
        hasMore,
        page: 1,
        totalPages: 1,
    };
}

module.exports = {
    getContentRequests,
    getContentRequestsStats,
    approveContentRequest,
    rejectContentRequest,
    deleteContentRequest,
};