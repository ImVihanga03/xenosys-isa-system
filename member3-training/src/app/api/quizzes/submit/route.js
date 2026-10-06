import pool from "@/lib/db";

export async function POST(request) {
  const client = await pool.connect();

  try {
    const body = await request.json();

    const { quizId, answers, userId = 1 } = body;

    if (!quizId || !answers) {
      return Response.json(
        {
          success: false,
          message: "Quiz ID and answers are required.",
        },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // Get quiz information
    const quizResult = await client.query(
      `SELECT quiz_id, module_id, pass_percentage
       FROM quizzes
       WHERE quiz_id = $1`,
      [quizId]
    );

    if (quizResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return Response.json(
        {
          success: false,
          message: "Quiz not found.",
        },
        { status: 404 }
      );
    }

    const quiz = quizResult.rows[0];

    // Correct answers stay on the SERVER
    const questionResult = await client.query(
      `SELECT question_id, correct_option
       FROM quiz_questions
       WHERE quiz_id = $1`,
      [quizId]
    );

    const questions = questionResult.rows;

    let correctAnswers = 0;

    questions.forEach((question) => {
      const selectedAnswer = answers[question.question_id];

      if (selectedAnswer === question.correct_option) {
        correctAnswers++;
      }
    });

    const totalQuestions = questions.length;

    const score =
      totalQuestions === 0
        ? 0
        : Math.round((correctAnswers / totalQuestions) * 100);

    const passed = score >= quiz.pass_percentage;

    // Save attempt
    await client.query(
      `INSERT INTO quiz_attempts
       (
         user_id,
         quiz_id,
         score,
         total_questions,
         correct_answers,
         passed
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        quizId,
        score,
        totalQuestions,
        correctAnswers,
        passed,
      ]
    );

    // Update training progress
    if (passed) {
      await client.query(
        `INSERT INTO training_progress
         (
           user_id,
           module_id,
           status,
           started_at,
           completed_at
         )
         VALUES ($1, $2, 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

         ON CONFLICT (user_id, module_id)

         DO UPDATE SET
           status = 'COMPLETED',
           completed_at = CURRENT_TIMESTAMP`,
        [userId, quiz.module_id]
      );
    } else {
      await client.query(
        `INSERT INTO training_progress
         (
           user_id,
           module_id,
           status,
           started_at
         )
         VALUES ($1, $2, 'IN_PROGRESS', CURRENT_TIMESTAMP)

         ON CONFLICT (user_id, module_id)

         DO UPDATE SET
           status =
             CASE
               WHEN training_progress.status = 'COMPLETED'
               THEN 'COMPLETED'
               ELSE 'IN_PROGRESS'
             END`,
        [userId, quiz.module_id]
      );
    }

    await client.query("COMMIT");

    return Response.json({
      success: true,
      result: {
        score,
        correctAnswers,
        totalQuestions,
        passed,
        passPercentage: quiz.pass_percentage,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Quiz submission error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to submit quiz.",
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}