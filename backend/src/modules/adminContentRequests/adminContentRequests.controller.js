const adminContentRequestsService = require('./adminContentRequests.service');

async function getContentRequests(req, res) {
    const result = await adminContentRequestsService.getContentRequests({
        query: req.query,
    });

    res.json(result);
}

async function getContentRequestsStats(req, res) {
    const result = await adminContentRequestsService.getContentRequestsStats();

    res.json(result);
}

async function approveContentRequest(req, res) {
    const result = await adminContentRequestsService.approveContentRequest({
        admin: req.user,
        requestId: req.params.requestId,
        payload: req.body,
    });

    res.json(result);
}

async function rejectContentRequest(req, res) {
    const result = await adminContentRequestsService.rejectContentRequest({
        admin: req.user,
        requestId: req.params.requestId,
    });

    res.json(result);
}

async function deleteContentRequest(req, res) {
    const result = await adminContentRequestsService.deleteContentRequest({
        requestId: req.params.requestId,
    });

    res.json(result);
}

module.exports = {
    getContentRequests,
    getContentRequestsStats,
    approveContentRequest,
    rejectContentRequest,
    deleteContentRequest,
};