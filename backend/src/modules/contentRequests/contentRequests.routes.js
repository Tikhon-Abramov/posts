const express = require('express');

const contentRequestsController = require('./contentRequests.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const contentRequestUploadMiddleware = require('../../middlewares/contentRequestUploadMiddleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.post(
    '/',
    authMiddleware,
    contentRequestUploadMiddleware.single('media'),
    asyncHandler(contentRequestsController.createContentRequest)
);

router.get(
    '/my',
    authMiddleware,
    asyncHandler(contentRequestsController.getMyContentRequests)
);

router.get(
    '/my/stats',
    authMiddleware,
    asyncHandler(contentRequestsController.getMyContentRequestsStats)
);

module.exports = router;