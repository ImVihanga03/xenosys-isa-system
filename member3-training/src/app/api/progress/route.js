import pool from "@/lib/db";

export async function GET() {
  try {
    // Temporary user until the group's login system is connected
    const userId = 1;

    const result = await pool.query(
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
          INNER JOIN quizzes q
            ON q.quiz_id = qa.quiz_id
          WHERE qa.user_id = $1
            AND q.module_id = tm.module_id
        ) AS best_score

      FROM training_modules tm

      LEFT JOIN training_progress tp
        ON tp.module_id = tm.module_id
        AND tp.user_id = $1

      WHERE tm.is_active = TRUE

      ORDER BY tm.module_id ASC
      `,
      [userId]
    );

    const modules = result.rows;

    const totalModules = modules.length;

    const completedModules = modules.filter(
      (module) => module.status === "COMPLETED"
    ).length;

    const remainingModules = totalModules - completedModules;

    const progressPercentage =
      totalModules === 0
        ? 0
        : Math.round((completedModules / totalModules) * 100);

    return Response.json({
      success: true,

      summary: {
        totalModules,
        completedModules,
        remainingModules,
        progressPercentage,
      },

      modules,
    });
  } catch (error) {
    console.error("Progress API error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to load training progress.",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}