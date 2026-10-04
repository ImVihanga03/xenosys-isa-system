const complianceService = require('./compliance.service');

const getMyCompliance = async (req, res) => {
  try {
    // දැනට fake data
    const data = await complianceService.getMyCompliance();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOverview = async (req, res) => {
  try {
    const data = await complianceService.getOverview();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPending = async (req, res) => {
  try {
    const data = await complianceService.getPending();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyCompliance,
  getOverview,
  getPending,
};