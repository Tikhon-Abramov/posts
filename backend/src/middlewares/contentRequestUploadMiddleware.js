const fs = require('fs');
const path = require('path');

const multer = require('multer');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const REQUEST_MEDIA_MAX_SIZE = 40 * 1024 * 1024;

const requestsDir = path.resolve(process.cwd(), env.uploadsDir, 'requests');

fs.mkdirSync(requestsDir, {
    recursive: true,
});

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, requestsDir);
    },

    filename(req, file, callback) {
        const extension = path.extname(file.originalname || '').toLowerCase();
        const safeExtension = extension || '';
        const fileName = `request-${req.user.id}-${Date.now()}${safeExtension}`;

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

const contentRequestUploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: REQUEST_MEDIA_MAX_SIZE,
    },
});

module.exports = contentRequestUploadMiddleware;