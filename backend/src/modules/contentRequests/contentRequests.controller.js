const contentRequestsService = require('./contentRequests.service');

async function createContentRequest(req, res) {
    const result = await contentRequestsService.createContentRequest({
        viewer: req.user,
        payload: req.body,
        file: req.file,
    });

    res.status(201).json(result);
}

async function getMyContentRequests(req, res) {
    const result = await contentRequestsService.getMyContentRequests({
        viewer: req.user,
        query: req.query,
    });

    res.json(result);
}

async function getMyContentRequestsStats(req, res) {
    const result = await contentRequestsService.getMyContentRequestsStats(req.user.id);

    res.json(result);
}

module.exports = {
    createContentRequest,
    getMyContentRequests,
    getMyContentRequestsStats,
};