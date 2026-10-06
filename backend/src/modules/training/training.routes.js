const express = require('express');
const router = express.Router();
const trainingController = require('./training.controller');
const { authenticate } = require('../../shared/middleware/authenticate');

router.use(authenticate);

router.get('/progress', trainingController.getProgress);
router.get('/modules/:id', trainingController.getModule);
router.get('/quizzes/module/:id', trainingController.getQuiz);
router.post('/quizzes/submit', trainingController.submitQuiz);

module.exports = router;