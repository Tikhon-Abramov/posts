const { pool } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

const IMAGE_MAX_SIZE = 8 * 1024 * 1024;
const VIDEO_MAX_SIZE = 40 * 1024 * 1024;

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

function getMediaTypeFromFile(file) {
    if (file.mimetype.startsWith('image/')) {
        return 'IMAGE';
    }

    if (file.mimetype.startsWith('video/')) {
        return 'VIDEO';
    }

    throw ApiError.badRequest('Можно загрузить только изображение или видео.');
}

function validateFile(file) {
    if (!file) {
        throw ApiError.badRequest('Выберите фото или видео для заявки.');
    }

    const mediaType = getMediaTypeFromFile(file);

    if (mediaType === 'IMAGE' && file.size > IMAGE_MAX_SIZE) {
        throw ApiError.badRequest('Изображение не должно быть больше 8 MB.');
    }

    if (mediaType === 'VIDEO' && file.size > VIDEO_MAX_SIZE) {
        throw ApiError.badRequest('Видео не должно быть больше 40 MB.');
    }

    return mediaType;
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

async function createContentRequest({ viewer, payload, file }) {
    const title = String(payload.title || '').trim();
    const description = String(payload.description || '').trim();
    const suggestedVisibility = normalizeVisibility(payload.suggestedVisibility);

    if (title.length < 3) {
        throw ApiError.badRequest('Название должно содержать минимум 3 символа.');
    }

    if (title.length > 120) {
        throw ApiError.badRequest('Название не должно быть длиннее 120 символов.');
    }

    if (description.length > 2000) {
        throw ApiError.badRequest('Описание не должно быть длиннее 2000 символов.');
    }

    const mediaType = validateFile(file);
    const fileUrl = `/uploads/requests/${file.filename}`;

    const [result] = await pool.execute(
        `
      INSERT INTO content_requests (
        user_id,
        title,
        description,
        suggested_visibility,
        media_type,
        file_name,
        file_url,
        file_size,
        status,
        reviewed_at,
        published_post_id
      )
      VALUES (
        :userId,
        :title,
        :description,
        :suggestedVisibility,
        :mediaType,
        :fileName,
        :fileUrl,
        :fileSize,
        'PENDING',
        NULL,
        NULL
      )
    `,
        {
            userId: viewer.id,
            title,
            description,
            suggestedVisibility,
            mediaType,
            fileName: file.originalname,
            fileUrl,
            fileSize: file.size,
        }
    );

    return getContentRequestById({
        userId: viewer.id,
        requestId: result.insertId,
    });
}

async function getContentRequestById({ userId, requestId }) {
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
      WHERE cr.id = :requestId
        AND cr.user_id = :userId
      LIMIT 1
    `,
        {
            requestId,
            userId,
        }
    );

    if (!rows[0]) {
        throw ApiError.notFound('Заявка не найдена.');
    }

    return mapContentRequestRow(rows[0]);
}

async function getMyContentRequests({ viewer, query }) {
    const limit = parseLimit(query.limit);

    const params = {
        userId: viewer.id,
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
      WHERE cr.user_id = :userId
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

async function getMyContentRequestsStats(userId) {
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
      WHERE user_id = :userId
    `,
        {
            userId,
        }
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
    createContentRequest,
    getMyContentRequests,
    getMyContentRequestsStats,
};