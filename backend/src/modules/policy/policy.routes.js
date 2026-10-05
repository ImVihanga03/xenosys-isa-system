const express = require('express');
const router = express.Router();
const policyController = require('./policy.controller');
const { authenticate } = require('../../shared/middleware/authenticate');
const { requireRole } = require('../../shared/middleware/requireRole');

// All policy routes require authentication
router.use(authenticate);

// Employee / General routes
router.get('/', policyController.getPolicies);
router.get('/stats', requireRole('admin', 'security_officer'), policyController.getStats);
router.get('/admin/all', requireRole('admin', 'security_officer'), policyController.getAdminPolicies);
router.get('/:id', policyController.getPolicy);
router.post('/:id/acknowledge', policyController.acknowledgePolicy);

// Admin & Security Officer management routes
router.post('/', requireRole('admin', 'security_officer'), policyController.createPolicy);
router.put('/:id', requireRole('admin', 'security_officer'), policyController.updatePolicy);
router.delete('/:id', requireRole('admin'), policyController.deletePolicy);

module.exports = router;
