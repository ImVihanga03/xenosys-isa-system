// දැනට fake/sample data (පස්සේ real data එකතු කරනවා)

const getMyCompliance = async () => {
  return {
    policyAcknowledged: true,
    trainingCompleted: false,
    quizScore: null,
    overallStatus: 'Pending',
  };
};

const getOverview = async () => {
  return {
    totalEmployees: 30,
    policyCompliance: 70,
    trainingCompliance: 55,
    quizPassRate: 40,
    overallCompliance: 55,
  };
};

const getPending = async () => {
  return [
    { id: 1, name: 'Employee A', pending: ['Training', 'Quiz'] },
    { id: 2, name: 'Employee B', pending: ['Policy Acknowledgement'] },
  ];
};

module.exports = {
  getMyCompliance,
  getOverview,
  getPending,
};