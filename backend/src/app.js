const path = require('path');

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
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

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
