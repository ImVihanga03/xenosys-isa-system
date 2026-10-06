const trainingService = require('./training.service');

async function getProgress(req, res) {
  try {
    const data = await trainingService.getProgress(req.user.id);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to load training progress' });
  }
}

async function getModule(req, res) {
  try {
    const module = await trainingService.getModuleById(req.params.id);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Training module not found' });
    }
    res.json({ success: true, module });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch training module' });
  }
}

async function getQuiz(req, res) {
  try {
    const quiz = await trainingService.getQuizByModuleId(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    res.json({ success: true, quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to load quiz' });
  }
}

async function submitQuiz(req, res) {
  try {
    const { quizId, answers } = req.body;
    if (!quizId || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Quiz ID and answers are required',
      });
    }
    const data = await trainingService.submitQuiz(req.user.id, quizId, answers);
    if (data.error) {
      return res.status(data.status || 400).json({ success: false, message: data.error });
    }
    res.json({ success: true, result: data.result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to submit quiz' });
  }
}

module.exports = {
  getProgress,
  getModule,
  getQuiz,
  submitQuiz,
};