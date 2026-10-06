const express = require('express');
const router = express.Router();
const complianceController = require('./compliance.controller');
const { authenticate } = require('../../shared/middleware/authenticate');

router.use(authenticate);

router.get('/me', complianceController.getMyCompliance);
router.get('/overview', complianceController.getOverview);
router.get('/pending', complianceController.getPending);

module.exports = router;