const notificationsService = require('./notifications.service');

async function getNotifications(req, res) {
    const result = await notificationsService.getNotifications({
        userId: req.user.id,
        query: req.query,
    });

    res.json(result);
}

async function getNotificationsStats(req, res) {
    const result = await notificationsService.getNotificationsStats(req.user.id);

    res.json(result);
}

async function getLatestNotifications(req, res) {
    const result = await notificationsService.getLatestNotifications({
        userId: req.user.id,
        query: req.query,
    });

    res.json(result);
}

async function markAllAsRead(req, res) {
    const result = await notificationsService.markAllAsRead(req.user.id);

    res.json(result);
}

async function deleteNotification(req, res) {
    const result = await notificationsService.deleteNotification({
        userId: req.user.id,
        notificationId: req.params.notificationId,
    });

    res.json(result);
}

async function clearNotifications(req, res) {
    const result = await notificationsService.clearNotifications(req.user.id);

    res.json(result);
}

module.exports = {
    getNotifications,
    getNotificationsStats,
    getLatestNotifications,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
};