const express = require('express');

const authController = require('./auth.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

router.get('/me', authMiddleware, asyncHandler(authController.getMe));

router.patch(
    '/change-password',
    authMiddleware,
    asyncHandler(authController.changePassword)
);

module.exports = router;