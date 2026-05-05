const express = require('express');

const notificationsController = require('./notifications.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(notificationsController.getNotifications));

router.get(
    '/stats',
    authMiddleware,
    asyncHandler(notificationsController.getNotificationsStats)
);

router.get(
    '/latest',
    authMiddleware,
    asyncHandler(notificationsController.getLatestNotifications)
);

router.patch(
    '/read-all',
    authMiddleware,
    asyncHandler(notificationsController.markAllAsRead)
);

router.delete(
    '/',
    authMiddleware,
    asyncHandler(notificationsController.clearNotifications)
);

router.delete(
    '/:notificationId',
    authMiddleware,
    asyncHandler(notificationsController.deleteNotification)
);

module.exports = router;