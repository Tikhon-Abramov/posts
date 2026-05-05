const express = require('express');

const subscriptionsController = require('./subscriptions.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', asyncHandler(subscriptionsController.getMySubscription));

router.post(
    '/test-activate',
    asyncHandler(subscriptionsController.activateTestSubscription)
);

router.post('/cancel', asyncHandler(subscriptionsController.cancelSubscription));

module.exports = router;