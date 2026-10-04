const { audit } = require('../utils/audit');

exports.requireRole = (...roles) => async (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    await audit(req, 'ACCESS_DENIED', req.originalUrl, 'FAILURE');
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};