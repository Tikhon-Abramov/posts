const subscriptionsService = require('./subscriptions.service');

async function getMySubscription(req, res) {
    const result = await subscriptionsService.getMySubscription(req.user.id);

    res.json(result);
}

async function activateTestSubscription(req, res) {
    const result = await subscriptionsService.activateTestSubscription(req.user.id);

    res.json(result);
}

async function cancelSubscription(req, res) {
    const result = await subscriptionsService.cancelSubscription(req.user.id);

    res.json(result);
}

module.exports = {
    getMySubscription,
    activateTestSubscription,
    cancelSubscription,
};