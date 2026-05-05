const postsService = require('./posts.service');

async function getPublicFeed(req, res) {
    const result = await postsService.getFeed({
        viewer: req.user,
        type: 'public',
        query: req.query,
    });

    res.json(result);
}

async function getPremiumFeed(req, res) {
    const result = await postsService.getFeed({
        viewer: req.user,
        type: 'premium',
        query: req.query,
    });

    res.json(result);
}

async function getLatestPublicFeed(req, res) {
    const result = await postsService.getLatestFeedPosts({
        viewer: req.user,
        type: 'public',
        query: req.query,
    });

    res.json(result);
}

async function getLatestPremiumFeed(req, res) {
    const result = await postsService.getLatestFeedPosts({
        viewer: req.user,
        type: 'premium',
        query: req.query,
    });

    res.json(result);
}

async function getPostById(req, res) {
    const post = await postsService.getPostById({
        viewer: req.user,
        postId: req.params.postId,
    });

    res.json(post);
}

async function getSavedPosts(req, res) {
    const result = await postsService.getSavedPosts({
        viewer: req.user,
        query: req.query,
    });

    res.json(result);
}

async function getSavedPostsStats(req, res) {
    const result = await postsService.getSavedPostsStats(req.user.id);

    res.json(result);
}

async function getMyPosts(req, res) {
    const result = await postsService.getMyPosts({
        viewer: req.user,
        query: req.query,
    });

    res.json(result);
}

async function getMyPostsStats(req, res) {
    const result = await postsService.getMyPostsStats(req.user.id);

    res.json(result);
}

async function likePost(req, res) {
    const result = await postsService.updateReaction({
        viewer: req.user,
        postId: req.params.postId,
        nextReaction: 'LIKE',
    });

    res.json(result);
}

async function dislikePost(req, res) {
    const result = await postsService.updateReaction({
        viewer: req.user,
        postId: req.params.postId,
        nextReaction: 'DISLIKE',
    });

    res.json(result);
}

async function savePost(req, res) {
    const result = await postsService.savePost({
        viewer: req.user,
        postId: req.params.postId,
    });

    res.json(result);
}

async function unsavePost(req, res) {
    const result = await postsService.unsavePost({
        viewer: req.user,
        postId: req.params.postId,
    });

    res.json(result);
}

module.exports = {
    getPublicFeed,
    getPremiumFeed,
    getLatestPublicFeed,
    getLatestPremiumFeed,
    getPostById,
    getSavedPosts,
    getSavedPostsStats,
    getMyPosts,
    getMyPostsStats,
    likePost,
    dislikePost,
    savePost,
    unsavePost,
};