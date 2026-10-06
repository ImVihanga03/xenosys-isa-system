const complianceService = require('./compliance.service');

async function getMyCompliance(req, res) {
  try {
    const data = await complianceService.getMyCompliance(req.user?.id || 1);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load compliance' });
  }
}

async function getOverview(req, res) {
  try {
    const data = await complianceService.getOverview();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load overview' });
  }
}

async function getPending(req, res) {
  try {
    const data = await complianceService.getPending();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load pending' });
  }
}

module.exports = {
  getMyCompliance,
  getOverview,
  getPending,
};