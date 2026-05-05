const express = require('express');

const usersController = require('./users.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const uploadMiddleware = require('../../middlewares/uploadMiddleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.patch('/me', authMiddleware, asyncHandler(usersController.updateMe));

router.post(
    '/me/avatar',
    authMiddleware,
    uploadMiddleware.single('avatar'),
    asyncHandler(usersController.uploadAvatar)
);

module.exports = router;