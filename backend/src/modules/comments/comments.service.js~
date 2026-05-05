const { pool } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

const DEFAULT_LIMIT = 20;
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

function toIsoDate(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    return new Date(value).toISOString();
}

function canViewPremiumPost(viewer, post) {
    if (post.visibility !== 'PREMIUM') {
        return true;
    }

    if (!viewer) {
        return false;
    }

    if (viewer.role === 'ADMIN') {
        return true;
    }

    if (Number(viewer.id) === Number(post.author_id)) {
        return true;
    }

    return Boolean(viewer.hasPremium);
}

function assertCanViewPost(viewer, post) {
    if (post.visibility !== 'PREMIUM') {
        return;
    }

    if (!viewer) {
        throw ApiError.unauthorized('Для просмотра комментариев Premium-поста нужно войти.');
    }

    if (!canViewPremiumPost(viewer, post)) {
        throw ApiError.forbidden(
            'Для просмотра комментариев Premium-поста нужна подписка.'
        );
    }
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

    return 'AND c.created_at < :cursorDate';
}

function mapCommentRow(row) {
    return {
        id: Number(row.id),
        postId: Number(row.post_id),
        author: {
            id: Number(row.author_id),
            nickname: row.author_nickname,
            avatarUrl: row.author_avatar_url || null,
        },
        text: row.text,
        createdAt: toIsoDate(row.created_at),
        updatedAt: row.updated_at ? toIsoDate(row.updated_at) : null,
    };
}

async function getPostAccess(postId) {
    const [rows] = await pool.execute(
        `
      SELECT
        id,
        author_id,
        title,
        visibility
      FROM posts
      WHERE id = :postId
        AND deleted_at IS NULL
      LIMIT 1
    `,
        {
            postId,
        }
    );

    return rows[0] || null;
}

async function getComments({ viewer, postId, query }) {
    const normalizedPostId = parseId(postId, 'postId');
    const limit = parseLimit(query.limit);

    const post = await getPostAccess(normalizedPostId);

    if (!post) {
        throw ApiError.notFound('Пост не найден.');
    }

    assertCanViewPost(viewer, post);

    const params = {
        postId: normalizedPostId,
        limit: limit + 1,
    };

    const cursorCondition = buildCursorCondition({
        cursor: query.cursor,
        params,
    });

    const [rows] = await pool.execute(
        `
      SELECT
        c.id,
        c.post_id,
        c.author_id,
        c.text,
        c.created_at,
        c.updated_at,
        u.nickname AS author_nickname,
        u.avatar_url AS author_avatar_url
      FROM comments c
      INNER JOIN users u ON u.id = c.author_id
      WHERE c.post_id = :postId
        AND c.deleted_at IS NULL
        ${cursorCondition}
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT :limit
    `,
        params
    );

    return buildCursorResponse(rows, limit);
}

async function createComment({ viewer, postId, payload }) {
    const normalizedPostId = parseId(postId, 'postId');
    const text = String(payload.text || '').trim();

    if (text.length < 1) {
        throw ApiError.badRequest('Комментарий не может быть пустым.');
    }

    if (text.length > 1000) {
        throw ApiError.badRequest('Комментарий не должен быть длиннее 1000 символов.');
    }

    const post = await getPostAccess(normalizedPostId);

    if (!post) {
        throw ApiError.notFound('Пост не найден.');
    }

    assertCanViewPost(viewer, post);

    const [result] = await pool.execute(
        `
      INSERT INTO comments (
        post_id,
        author_id,
        text
      )
      VALUES (
        :postId,
        :authorId,
        :text
      )
    `,
        {
            postId: normalizedPostId,
            authorId: viewer.id,
            text,
        }
    );

    const comment = await getCommentById(result.insertId);

    if (post.author_id !== viewer.id) {
        await createCommentNotification({
            post,
            actorNickname: viewer.nickname,
        });
    }

    return comment;
}

async function getCommentById(commentId) {
    const [rows] = await pool.execute(
        `
      SELECT
        c.id,
        c.post_id,
        c.author_id,
        c.text,
        c.created_at,
        c.updated_at,
        u.nickname AS author_nickname,
        u.avatar_url AS author_avatar_url
      FROM comments c
      INNER JOIN users u ON u.id = c.author_id
      WHERE c.id = :commentId
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
        {
            commentId,
        }
    );

    if (!rows[0]) {
        throw ApiError.notFound('Комментарий не найден.');
    }

    return mapCommentRow(rows[0]);
}

async function createCommentNotification({ post, actorNickname }) {
    await pool.execute(
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
        'NEW_COMMENT',
        'Новый комментарий',
        :text,
        FALSE,
        :postId,
        NULL
      )
    `,
        {
            userId: post.author_id,
            text: `@${actorNickname} оставил комментарий к вашей публикации «${post.title}».`,
            postId: post.id,
        }
    );
}

async function deleteComment({ viewer, postId, commentId }) {
    const normalizedPostId = parseId(postId, 'postId');
    const normalizedCommentId = parseId(commentId, 'commentId');

    const post = await getPostAccess(normalizedPostId);

    if (!post) {
        throw ApiError.notFound('Пост не найден.');
    }

    assertCanViewPost(viewer, post);

    const [rows] = await pool.execute(
        `
      SELECT
        id,
        post_id,
        author_id
      FROM comments
      WHERE id = :commentId
        AND post_id = :postId
        AND deleted_at IS NULL
      LIMIT 1
    `,
        {
            commentId: normalizedCommentId,
            postId: normalizedPostId,
        }
    );

    const comment = rows[0];

    if (!comment) {
        throw ApiError.notFound('Комментарий не найден.');
    }

    const isCommentAuthor = Number(comment.author_id) === Number(viewer.id);
    const isAdmin = viewer.role === 'ADMIN';

    if (!isCommentAuthor && !isAdmin) {
        throw ApiError.forbidden('Удалить комментарий может только автор или админ.');
    }

    await pool.execute(
        `
      UPDATE comments
      SET deleted_at = NOW()
      WHERE id = :commentId
      LIMIT 1
    `,
        {
            commentId: normalizedCommentId,
        }
    );

    return {
        message: 'Комментарий удален.',
    };
}

function buildCursorResponse(rows, limit) {
    const hasMore = rows.length > limit;
    const responseRows = hasMore ? rows.slice(0, limit) : rows;
    const items = responseRows.map(mapCommentRow);
    const lastItem = items[items.length - 1] || null;

    return {
        items,
        comments: items,
        nextCursor: hasMore ? lastItem?.createdAt || null : null,
        hasMore,
        page: 1,
        totalPages: 1,
    };
}

module.exports = {
    getComments,
    createComment,
    deleteComment,
};