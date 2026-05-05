const express = require('express');

const postsController = require('./posts.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../../middlewares/optionalAuthMiddleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get(
    '/feed/public',
    optionalAuthMiddleware,
    asyncHandler(postsController.getPublicFeed)
);

router.get(
    '/feed/premium',
    authMiddleware,
    asyncHandler(postsController.getPremiumFeed)
);

router.get(
    '/feed/public/latest',
    optionalAuthMiddleware,
    asyncHandler(postsController.getLatestPublicFeed)
);

router.get(
    '/feed/premium/latest',
    authMiddleware,
    asyncHandler(postsController.getLatestPremiumFeed)
);

router.get(
    '/saved',
    authMiddleware,
    asyncHandler(postsController.getSavedPosts)
);

router.get(
    '/saved/stats',
    authMiddleware,
    asyncHandler(postsController.getSavedPostsStats)
);

router.get('/my', authMiddleware, asyncHandler(postsController.getMyPosts));

router.get(
    '/my/stats',
    authMiddleware,
    asyncHandler(postsController.getMyPostsStats)
);

router.get(
    '/:postId',
    optionalAuthMiddleware,
    asyncHandler(postsController.getPostById)
);

router.post('/:postId/like', authMiddleware, asyncHandler(postsController.likePost));

router.post(
    '/:postId/dislike',
    authMiddleware,
    asyncHandler(postsController.dislikePost)
);

router.post('/:postId/save', authMiddleware, asyncHandler(postsController.savePost));

router.delete(
    '/:postId/save',
    authMiddleware,
    asyncHandler(postsController.unsavePost)
);

module.exports = router;