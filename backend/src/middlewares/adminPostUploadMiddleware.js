const fs = require('fs');
const path = require('path');

const multer = require('multer');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const ADMIN_POST_MEDIA_MAX_SIZE = 40 * 1024 * 1024;

const postsDir = path.resolve(process.cwd(), env.uploadsDir, 'posts');

fs.mkdirSync(postsDir, {
    recursive: true,
});

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, postsDir);
    },

    filename(req, file, callback) {
        const extension = path.extname(file.originalname || '').toLowerCase();
        const safeExtension = extension || '';
        const fileName = `post-${req.user.id}-${Date.now()}${safeExtension}`;

        callback(null, fileName);
    },
});

function fileFilter(req, file, callback) {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (!isImage && !isVideo) {
        return callback(
            ApiError.badRequest('Можно загрузить только изображение или видео.')
        );
    }

    callback(null, true);
}

const adminPostUploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: ADMIN_POST_MEDIA_MAX_SIZE,
    },
});

module.exports = adminPostUploadMiddleware;