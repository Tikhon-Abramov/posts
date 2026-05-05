const express = require('express');

const commentsController = require('./comments.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../../middlewares/optionalAuthMiddleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router({
    mergeParams: true,
});

router.get('/', optionalAuthMiddleware, asyncHandler(commentsController.getComments));

router.post('/', authMiddleware, asyncHandler(commentsController.createComment));

router.delete(
    '/:commentId',
    authMiddleware,
    asyncHandler(commentsController.deleteComment)
);

module.exports = router;