import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS time"
    );

    return Response.json({
      success: true,
      message: "PostgreSQL connected successfully!",
      database: result.rows[0].database,
      time: result.rows[0].time,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return Response.json(
      {
        success: false,
        message: "Database connection failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}