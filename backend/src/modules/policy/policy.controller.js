const policyService = require('./policy.service');
const { audit } = require('../../shared/utils/audit');

exports.getPolicies = async (req, res, next) => {
  try {
    const policies = await policyService.listPolicies(req.user?.id);
    res.json({ policies });
  } catch (err) {
    next(err);
  }
};

exports.getAdminPolicies = async (req, res, next) => {
  try {
    const policies = await policyService.listAllPoliciesAdmin();
    res.json({ policies });
  } catch (err) {
    next(err);
  }
};

exports.getPolicy = async (req, res, next) => {
  try {
    const policy = await policyService.getPolicyById(req.params.id, req.user?.id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json({ policy });
  } catch (err) {
    next(err);
  }
};

exports.createPolicy = async (req, res, next) => {
  try {
    const { title, category, summary, content, version, isMandatory } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const policy = await policyService.createPolicy({
      title,
      category,
      summary,
      content,
      version: version || '1.0',
      is_mandatory: isMandatory !== false,
      created_by: req.user?.id
    });

    await audit(req, 'POLICY_CREATED', `policy:${policy.id}`, 'SUCCESS');
    res.status(201).json({ message: 'Policy published successfully', policy });
  } catch (err) {
    await audit(req, 'POLICY_CREATED', 'policy:new', 'FAILURE');
    next(err);
  }
};

exports.updatePolicy = async (req, res, next) => {
  try {
    const { title, category, summary, content, version, isMandatory, isActive } = req.body;
    const policy = await policyService.updatePolicy(req.params.id, {
      title,
      category,
      summary,
      content,
      version,
      is_mandatory: isMandatory,
      is_active: isActive
    });

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    await audit(req, 'POLICY_UPDATED', `policy:${policy.id}`, 'SUCCESS');
    res.json({ message: 'Policy updated successfully', policy });
  } catch (err) {
    await audit(req, 'POLICY_UPDATED', `policy:${req.params.id}`, 'FAILURE');
    next(err);
  }
};

exports.deletePolicy = async (req, res, next) => {
  try {
    const success = await policyService.deletePolicy(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    await audit(req, 'POLICY_DELETED', `policy:${req.params.id}`, 'SUCCESS');
    res.json({ message: 'Policy deleted successfully' });
  } catch (err) {
    await audit(req, 'POLICY_DELETED', `policy:${req.params.id}`, 'FAILURE');
    next(err);
  }
};

exports.acknowledgePolicy = async (req, res, next) => {
  try {
    const policyId = req.params.id;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.get('user-agent') || '';

    const result = await policyService.acknowledgePolicy(policyId, req.user, ip, userAgent);
    await audit(req, 'POLICY_ACKNOWLEDGED', `policy:${policyId}`, 'SUCCESS');

    res.json({
      message: 'Policy acknowledged successfully',
      acknowledgement: result.acknowledgement
    });
  } catch (err) {
    await audit(req, 'POLICY_ACKNOWLEDGED', `policy:${req.params.id}`, 'FAILURE');
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = await policyService.getComplianceStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
