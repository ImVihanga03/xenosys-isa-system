const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cfg = require('./config/env');
const errorHandler = require('./shared/middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors({ origin: cfg.clientOrigin, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/admin/users', require('./modules/admin/users.routes'));
app.use('/api/compliance', require('./modules/compliance/compliance.routes'));
app.use('/api/policies', require('./modules/policy/policy.routes'));
app.use('/api/training', require('./modules/training/training.routes'));

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);
module.exports = app;