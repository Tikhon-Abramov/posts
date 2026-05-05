const adminPostsService = require('./adminPosts.service');

async function getPosts(req, res) {
    const result = await adminPostsService.getPosts({
        admin: req.user,
        query: req.query,
    });

    res.json(result);
}

async function getPostsStats(req, res) {
    const result = await adminPostsService.getPostsStats();

    res.json(result);
}

async function createPost(req, res) {
    const post = await adminPostsService.createPost({
        admin: req.user,
        payload: req.body,
        file: req.file,
    });

    res.status(201).json(post);
}

async function deletePost(req, res) {
    const result = await adminPostsService.deletePost({
        postId: req.params.postId,
    });

    res.json(result);
}

module.exports = {
    getPosts,
    getPostsStats,
    createPost,
    deletePost,
};