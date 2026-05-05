const path = require('path');

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const adminContentRequestsRoutes = require('./modules/adminContentRequests/adminContentRequests.routes');
const adminPostsRoutes = require('./modules/adminPosts/adminPosts.routes');
const authRoutes = require('./modules/auth/auth.routes');
const commentsRoutes = require('./modules/comments/comments.routes');
const contentRequestsRoutes = require('./modules/contentRequests/contentRequests.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const postsRoutes = require('./modules/posts/posts.routes');
const subscriptionsRoutes = require('./modules/subscriptions/subscriptions.routes');
const usersRoutes = require('./modules/users/users.routes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');

const app = express();

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: 'cross-origin',
        },
    })
);

app.use(
    cors({
        origin: env.clientUrl,
        credentials: true,
    })
);

app.use(morgan('dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadsDir)));

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'PulseFeed API is running',
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/admin/content-requests', adminContentRequestsRoutes);
app.use('/api/admin/posts', adminPostsRoutes);
app.use('/api/content-requests', contentRequestsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/posts/:postId/comments', commentsRoutes);
app.use('/api/posts', postsRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;