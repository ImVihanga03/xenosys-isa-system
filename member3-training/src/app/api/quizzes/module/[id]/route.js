import pool from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const quizResult = await pool.query(
      `SELECT quiz_id, module_id, title, pass_percentage
       FROM quizzes
       WHERE module_id = $1`,
      [id]
    );

    if (quizResult.rows.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Quiz not found",
        },
        { status: 404 }
      );
    }

    const quiz = quizResult.rows[0];

    const questionResult = await pool.query(
      `SELECT
        question_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d
       FROM quiz_questions
       WHERE quiz_id = $1
       ORDER BY question_id`,
      [quiz.quiz_id]
    );

    return Response.json({
      success: true,
      quiz: {
        ...quiz,
        questions: questionResult.rows,
      },
    });
  } catch (error) {
    console.error("Quiz API error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to load quiz",
        error: error.message,
      },
      { status: 500 }
    );
  }
}