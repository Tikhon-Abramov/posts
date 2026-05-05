const fs = require('fs');
const path = require('path');

const multer = require('multer');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const AVATAR_MAX_SIZE = 8 * 1024 * 1024;

const avatarsDir = path.resolve(process.cwd(), env.uploadsDir, 'avatars');

fs.mkdirSync(avatarsDir, {
    recursive: true,
});

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, avatarsDir);
    },

    filename(req, file, callback) {
        const extension = path.extname(file.originalname || '').toLowerCase();
        const safeExtension = extension || '.jpg';
        const fileName = `avatar-${req.user.id}-${Date.now()}${safeExtension}`;

        callback(null, fileName);
    },
});

function fileFilter(req, file, callback) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
            ApiError.badRequest('Аватар должен быть изображением JPG, PNG или WEBP.')
        );
    }

    callback(null, true);
}

const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: AVATAR_MAX_SIZE,
    },
});

module.exports = uploadMiddleware;