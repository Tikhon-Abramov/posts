const fs = require('fs');
const path = require('path');

const env = require('../../config/env');
const { pool } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const IMAGE_MAX_SIZE = 8 * 1024 * 1024;
const VIDEO_MAX_SIZE = 40 * 1024 * 1024;

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

function normalizeVisibility(value) {
    if (value === 'PUBLIC' || value === 'PREMIUM') {
        return value;
    }

    return 'ALL';
}

function normalizeCreateVisibility(value) {
    if (value === 'PREMIUM') {
        return 'PREMIUM';
    }

    return 'PUBLIC';
}

function normalizeMediaType(value) {
    if (value === 'IMAGE' || value === 'VIDEO') {
        return value;
    }

    return 'ALL';
}

function normalizeSort(value) {
    if (value === 'POPULAR') {
        return 'POPULAR';
    }

    return 'RECENT';
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
        throw ApiError.badRequest('Выберите фото или видео для публикации.');
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
        likesCount: Number(row.likes_count || 0),
        dislikesCount: Number(row.dislikes_count || 0),
        commentsCount: Number(row.comments_count || 0),
        isLikedByMe: false,
        isDislikedByMe: false,
        isSavedByMe: false,
        createdAt: toIsoDate(row.created_at),
    };
}

function buildPostsSelect() {
    return `
    SELECT
      p.id,
      p.title,
      p.description,
      p.visibility,
      p.created_at,
      u.id AS author_id,
      u.nickname AS author_nickname,
      u.avatar_url AS author_avatar_url,
      pm.id AS media_id,
      pm.type AS media_type,
      pm.url AS media_url,

      (
        SELECT COUNT(*)
        FROM post_reactions pr_like
        WHERE pr_like.post_id = p.id
          AND pr_like.type = 'LIKE'
      ) AS likes_count,

      (
        SELECT COUNT(*)
        FROM post_reactions pr_dislike
        WHERE pr_dislike.post_id = p.id
          AND pr_dislike.type = 'DISLIKE'
      ) AS dislikes_count,

      (
        SELECT COUNT(*)
        FROM comments c
        WHERE c.post_id = p.id
          AND c.deleted_at IS NULL
      ) AS comments_count

    FROM posts p
    INNER JOIN users u ON u.id = p.author_id
    LEFT JOIN post_media pm ON pm.post_id = p.id
  `;
}

function buildSearchCondition({ search, params }) {
    const normalizedSearch = normalizeSearch(search);

    if (!normalizedSearch) {
        return '';
    }

    params.searchLike = `%${normalizedSearch}%`;

    return `
    AND (
      p.title LIKE :searchLike
      OR p.description LIKE :searchLike
      OR u.nickname LIKE :searchLike
      OR CAST(p.id AS CHAR) LIKE :searchLike
    )
  `;
}

function buildVisibilityCondition({ visibility, params }) {
    const normalizedVisibility = normalizeVisibility(visibility);

    if (normalizedVisibility === 'ALL') {
        return '';
    }

    params.visibility = normalizedVisibility;

    return 'AND p.visibility = :visibility';
}

function buildMediaCondition({ mediaType, params }) {
    const normalizedMediaType = normalizeMediaType(mediaType);

    if (normalizedMediaType === 'ALL') {
        return '';
    }

    params.mediaType = normalizedMediaType;

    return 'AND pm.type = :mediaType';
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

    return 'AND p.created_at < :cursorDate';
}

function getOrderBy(sort) {
    if (sort === 'POPULAR') {
        return `
      ORDER BY
        (likes_count + comments_count - dislikes_count) DESC,
        p.created_at DESC,
        p.id DESC
    `;
    }

    return `
    ORDER BY
      p.created_at DESC,
      p.id DESC
  `;
}

async function getPosts({ query }) {
    const limit = parseLimit(query.limit);
    const sort = normalizeSort(query.sort);

    const params = {
        limit: limit + 1,
    };

    const searchCondition = buildSearchCondition({
        search: query.search,
        params,
    });

    const visibilityCondition = buildVisibilityCondition({
        visibility: query.visibility,
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
      ${buildPostsSelect()}
      WHERE p.deleted_at IS NULL
        ${searchCondition}
        ${visibilityCondition}
        ${mediaCondition}
        ${cursorCondition}
      ${getOrderBy(sort)}
      LIMIT :limit
    `,
        params
    );

    return buildCursorResponse(rows, limit);
}

async function getPostsStats() {
    const [rows] = await pool.execute(
        `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN p.visibility = 'PUBLIC' THEN 1 ELSE 0 END) AS public_posts,
        SUM(CASE WHEN p.visibility = 'PREMIUM' THEN 1 ELSE 0 END) AS premium_posts,
        SUM(CASE WHEN pm.type = 'IMAGE' THEN 1 ELSE 0 END) AS images_count,
        SUM(CASE WHEN pm.type = 'VIDEO' THEN 1 ELSE 0 END) AS videos_count
      FROM posts p
      LEFT JOIN post_media pm ON pm.post_id = p.id
      WHERE p.deleted_at IS NULL
    `
    );

    const row = rows[0] || {};

    return {
        total: Number(row.total || 0),
        publicPosts: Number(row.public_posts || 0),
        premiumPosts: Number(row.premium_posts || 0),
        imagesCount: Number(row.images_count || 0),
        videosCount: Number(row.videos_count || 0),
    };
}

async function createPost({ admin, payload, file }) {
    const title = String(payload.title || '').trim();
    const description = String(payload.description || '').trim();
    const visibility = normalizeCreateVisibility(payload.visibility);

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
    const fileUrl = `/uploads/posts/${file.filename}`;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

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
                authorId: admin.id,
                title,
                description,
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
                type: mediaType,
                url: fileUrl,
            }
        );

        await connection.commit();

        return {
            id: Number(postId),
            title,
            description,
            visibility,
            media: [
                {
                    id: Number(mediaResult.insertId),
                    type: mediaType,
                    url: fileUrl,
                },
            ],
            author: {
                id: Number(admin.id),
                nickname: admin.nickname,
                avatarUrl: admin.avatarUrl || null,
            },
            likesCount: 0,
            dislikesCount: 0,
            commentsCount: 0,
            isLikedByMe: false,
            isDislikedByMe: false,
            isSavedByMe: false,
            createdAt: new Date().toISOString(),
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function deletePost({ postId }) {
    const normalizedPostId = parseId(postId, 'postId');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [postRows] = await connection.execute(
            `
        SELECT id
        FROM posts
        WHERE id = :postId
          AND deleted_at IS NULL
        LIMIT 1
        FOR UPDATE
      `,
            {
                postId: normalizedPostId,
            }
        );

        if (!postRows[0]) {
            throw ApiError.notFound('Пост не найден.');
        }

        const [mediaRows] = await connection.execute(
            `
        SELECT url
        FROM post_media
        WHERE post_id = :postId
      `,
            {
                postId: normalizedPostId,
            }
        );

        await connection.execute(
            `
        DELETE FROM notifications
        WHERE post_id = :postId
      `,
            {
                postId: normalizedPostId,
            }
        );

        await connection.execute(
            `
        DELETE FROM posts
        WHERE id = :postId
        LIMIT 1
      `,
            {
                postId: normalizedPostId,
            }
        );

        await connection.commit();

        mediaRows.forEach((media) => {
            deleteLocalUploadFile(media.url);
        });

        return {
            message: 'Пост удален.',
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

function deleteLocalUploadFile(fileUrl) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
        return;
    }

    const relativePath = fileUrl.replace('/uploads/', '');
    const fullPath = path.resolve(process.cwd(), env.uploadsDir, relativePath);

    if (!fullPath.startsWith(path.resolve(process.cwd(), env.uploadsDir))) {
        return;
    }

    fs.unlink(fullPath, () => {});
}

function buildCursorResponse(rows, limit) {
    const hasMore = rows.length > limit;
    const responseRows = hasMore ? rows.slice(0, limit) : rows;
    const items = responseRows.map(mapPostRow);
    const lastItem = items[items.length - 1] || null;

    return {
        items,
        posts: items,
        nextCursor: hasMore ? lastItem?.createdAt || null : null,
        hasMore,
        page: 1,
        totalPages: 1,
    };
}

module.exports = {
    getPosts,
    getPostsStats,
    createPost,
    deletePost,
};