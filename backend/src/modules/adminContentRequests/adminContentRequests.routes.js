const express = require('express');

const adminContentRequestsController = require('./adminContentRequests.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const adminMiddleware = require('../../middlewares/adminMiddleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', asyncHandler(adminContentRequestsController.getContentRequests));

router.get(
    '/stats',
    asyncHandler(adminContentRequestsController.getContentRequestsStats)
);

router.post(
    '/:requestId/approve',
    asyncHandler(adminContentRequestsController.approveContentRequest)
);

router.post(
    '/:requestId/reject',
    asyncHandler(adminContentRequestsController.rejectContentRequest)
);

router.delete(
    '/:requestId',
    asyncHandler(adminContentRequestsController.deleteContentRequest)
);

module.exports = router;