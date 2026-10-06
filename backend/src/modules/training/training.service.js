const { query, pool } = require('../../db/pool');

async function getProgress(userId) {
  const result = await query(
    `
    SELECT
      tm.module_id,
      tm.title,
      tm.description,
      tm.category,
      tm.estimated_time,
      tm.is_active,
      COALESCE(tp.status, 'NOT_STARTED') AS status,
      tp.started_at,
      tp.completed_at,
      (
        SELECT MAX(qa.score)
        FROM quiz_attempts qa
        INNER JOIN quizzes q ON q.quiz_id = qa.quiz_id
        WHERE qa.user_id = $1 AND q.module_id = tm.module_id
      ) AS best_score
    FROM training_modules tm
    LEFT JOIN training_progress tp
      ON tp.module_id = tm.module_id AND tp.user_id = $1
    WHERE tm.is_active = TRUE
    ORDER BY tm.module_id ASC
    `,
    [userId]
  );

  const modules = result.rows;
  const totalModules = modules.length;
  const completedModules = modules.filter((m) => m.status === 'COMPLETED').length;
  const remainingModules = totalModules - completedModules;
  const progressPercentage =
    totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100);

  return {
    summary: { totalModules, completedModules, remainingModules, progressPercentage },
    modules,
  };
}

async function getModuleById(id) {
  const result = await query(
    `
    SELECT module_id, title, description, content, category, estimated_time
    FROM training_modules
    WHERE module_id = $1 AND is_active = TRUE
    `,
    [id]
  );
  return result.rows[0] || null;
}

async function getQuizByModuleId(moduleId) {
  const quizResult = await query(
    `SELECT quiz_id, module_id, title, pass_percentage
     FROM quizzes WHERE module_id = $1`,
    [moduleId]
  );
  if (quizResult.rows.length === 0) return null;

  const quiz = quizResult.rows[0];
  const questionResult = await query(
    `
    SELECT question_id, question_text, option_a, option_b, option_c, option_d
    FROM quiz_questions
    WHERE quiz_id = $1
    ORDER BY question_id
    `,
    [quiz.quiz_id]
  );

  return { ...quiz, questions: questionResult.rows };
}

async function submitQuiz(userId, quizId, answers) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const quizResult = await client.query(
      `SELECT quiz_id, module_id, pass_percentage FROM quizzes WHERE quiz_id = $1`,
      [quizId]
    );
    if (quizResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { error: 'Quiz not found', status: 404 };
    }
    const quiz = quizResult.rows[0];

    const questionResult = await client.query(
      `SELECT question_id, correct_option FROM quiz_questions WHERE quiz_id = $1`,
      [quizId]
    );
    const questions = questionResult.rows;

    let correctAnswers = 0;
    questions.forEach((q) => {
      if (answers[q.question_id] === q.correct_option) correctAnswers++;
    });

    const totalQuestions = questions.length;
    const score =
      totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= quiz.pass_percentage;

    await client.query(
      `INSERT INTO quiz_attempts
       (user_id, quiz_id, score, total_questions, correct_answers, passed)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, quizId, score, totalQuestions, correctAnswers, passed]
    );

    if (passed) {
      await client.query(
        `INSERT INTO training_progress
         (user_id, module_id, status, started_at, completed_at)
         VALUES ($1, $2, 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, module_id)
         DO UPDATE SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP`,
        [userId, quiz.module_id]
      );
    } else {
      await client.query(
        `INSERT INTO training_progress
         (user_id, module_id, status, started_at)
         VALUES ($1, $2, 'IN_PROGRESS', CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, module_id)
         DO UPDATE SET
           status = CASE
             WHEN training_progress.status = 'COMPLETED' THEN 'COMPLETED'
             ELSE 'IN_PROGRESS'
           END`,
        [userId, quiz.module_id]
      );
    }

    await client.query('COMMIT');
    return {
      result: {
        score,
        correctAnswers,
        totalQuestions,
        passed,
        passPercentage: quiz.pass_percentage,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getProgress,
  getModuleById,
  getQuizByModuleId,
  submitQuiz,
};