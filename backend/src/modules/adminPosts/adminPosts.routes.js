const express = require('express');

const adminPostsController = require('./adminPosts.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const adminMiddleware = require('../../middlewares/adminMiddleware');
const adminPostUploadMiddleware = require('../../middlewares/adminPostUploadMiddleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', asyncHandler(adminPostsController.getPosts));

router.get('/stats', asyncHandler(adminPostsController.getPostsStats));

router.post(
    '/',
    adminPostUploadMiddleware.single('media'),
    asyncHandler(adminPostsController.createPost)
);

router.delete('/:postId', asyncHandler(adminPostsController.deletePost));

module.exports = router;