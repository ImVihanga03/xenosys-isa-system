const express = require('express');
const router = express.Router();
const complianceController = require('./compliance.controller');

// Employee - own compliance status
router.get('/me', complianceController.getMyCompliance);

// Admin - overall compliance
router.get('/overview', complianceController.getOverview);

// Admin - pending list
router.get('/pending', complianceController.getPending);

module.exports = router;