import pool from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT
        module_id,
        title,
        description,
        content,
        category,
        estimated_time
       FROM training_modules
       WHERE module_id = $1
       AND is_active = TRUE`,
      [id]
    );

    if (result.rows.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Training module not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      module: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching module:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch training module",
      },
      { status: 500 }
    );
  }
}