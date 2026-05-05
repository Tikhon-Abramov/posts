const commentsService = require('./comments.service');

async function getComments(req, res) {
    const result = await commentsService.getComments({
        viewer: req.user,
        postId: req.params.postId,
        query: req.query,
    });

    res.json(result);
}

async function createComment(req, res) {
    const comment = await commentsService.createComment({
        viewer: req.user,
        postId: req.params.postId,
        payload: req.body,
    });

    res.status(201).json(comment);
}

async function deleteComment(req, res) {
    const result = await commentsService.deleteComment({
        viewer: req.user,
        postId: req.params.postId,
        commentId: req.params.commentId,
    });

    res.json(result);
}

module.exports = {
    getComments,
    createComment,
    deleteComment,
};