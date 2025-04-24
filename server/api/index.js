const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

// Import routers
const collectionsRouter = require('./routes/collections');
const usersRouter       = require('./routes/users');
const prayerRouter      = require('./routes/prayer');

require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/', collectionsRouter);
app.use('/users', usersRouter);
app.use('/prayerTimings', prayerRouter);

// Global error handler
app.use(errorHandler);

module.exports = app;