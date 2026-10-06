import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        module_id,
        title,
        description,
        content,
        category,
        estimated_time,
        is_active,
        created_at
      FROM training_modules
      WHERE is_active = TRUE
      ORDER BY module_id
    `);

    return Response.json({
      success: true,
      modules: result.rows,
    });
  } catch (error) {
    console.error("Error fetching training modules:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch training modules",
        error: error.message,
      },
      { status: 500 }
    );
  }
}