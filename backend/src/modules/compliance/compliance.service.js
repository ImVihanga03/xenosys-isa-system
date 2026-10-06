const { query } = require('../../db/pool');

// Employee - own compliance status
async function getMyCompliance(userId) {
  // Policy acknowledgement (if policy tables exist)
  let policyAcknowledged = false;
  try {
    const policyRes = await query(
      `
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE pa.user_id IS NOT NULL)::int AS done
      FROM policies p
      LEFT JOIN policy_acknowledgements pa
        ON pa.policy_id = p.id AND pa.user_id = $1
      WHERE p.status = 'published'
      `,
      [userId]
    );
    const total = policyRes.rows[0]?.total || 0;
    const done = policyRes.rows[0]?.done || 0;
    policyAcknowledged = total > 0 && done >= total;
  } catch {
    // Policy tables may differ - keep false
    policyAcknowledged = false;
  }

  // Training progress
  const trainingRes = await query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM training_modules WHERE is_active = TRUE) AS total_modules,
      (SELECT COUNT(*)::int FROM training_progress
       WHERE user_id = $1 AND status = 'COMPLETED') AS completed_modules,
      (SELECT MAX(score) FROM quiz_attempts WHERE user_id = $1) AS best_quiz_score
    `,
    [userId]
  );

  const totalModules = trainingRes.rows[0]?.total_modules || 0;
  const completedModules = trainingRes.rows[0]?.completed_modules || 0;
  const quizScore = trainingRes.rows[0]?.best_quiz_score;
  const trainingCompleted = totalModules > 0 && completedModules >= totalModules;

  let overallStatus = 'Pending';
  if (policyAcknowledged && trainingCompleted) overallStatus = 'Compliant';
  else if (policyAcknowledged || trainingCompleted || completedModules > 0)
    overallStatus = 'In Progress';

  return {
    policyAcknowledged,
    trainingCompleted,
    quizScore: quizScore != null ? quizScore : null,
    overallStatus,
  };
}

// Admin - overall overview
async function getOverview() {
  const usersRes = await query(
    `SELECT COUNT(*)::int AS total FROM users WHERE is_active = TRUE AND role = 'employee'`
  );
  const totalEmployees = usersRes.rows[0]?.total || 0;

  // Training compliance %
  const trainingRes = await query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM training_modules WHERE is_active = TRUE) AS total_modules,
      (SELECT COUNT(DISTINCT user_id)::int FROM training_progress WHERE status = 'COMPLETED') AS users_completed
    `
  );
  const totalModules = trainingRes.rows[0]?.total_modules || 0;
  const usersCompleted = trainingRes.rows[0]?.users_completed || 0;

  let trainingCompliance = 0;
  if (totalEmployees > 0 && totalModules > 0) {
    trainingCompliance = Math.round((usersCompleted / totalEmployees) * 100);
  }

  // Quiz pass rate
  const quizRes = await query(
    `
    SELECT
      COUNT(*)::int AS total_attempts,
      COUNT(*) FILTER (WHERE passed = TRUE)::int AS passed_attempts
    FROM quiz_attempts
    `
  );
  const totalAttempts = quizRes.rows[0]?.total_attempts || 0;
  const passedAttempts = quizRes.rows[0]?.passed_attempts || 0;
  const quizPassRate =
    totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  // Policy compliance (best effort)
  let policyCompliance = 0;
  try {
    const policyRes = await query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM policies WHERE status = 'published') AS total_policies,
        (SELECT COUNT(DISTINCT user_id)::int FROM policy_acknowledgements) AS users_acked
      `
    );
    const totalPolicies = policyRes.rows[0]?.total_policies || 0;
    const usersAcked = policyRes.rows[0]?.users_acked || 0;
    if (totalEmployees > 0 && totalPolicies > 0) {
      policyCompliance = Math.round((usersAcked / totalEmployees) * 100);
    }
  } catch {
    policyCompliance = 0;
  }

  const overallCompliance = Math.round(
    (policyCompliance + trainingCompliance + quizPassRate) / 3
  );

  return {
    totalEmployees,
    policyCompliance,
    trainingCompliance,
    quizPassRate,
    overallCompliance,
  };
}

// Admin - pending employees
async function getPending() {
  const result = await query(
    `
    SELECT
      u.id,
      u.name,
      COALESCE(
        (
          SELECT array_agg(pending_item)
          FROM (
            SELECT 'Training' AS pending_item
            WHERE EXISTS (
              SELECT 1 FROM training_modules tm
              WHERE tm.is_active = TRUE
              AND NOT EXISTS (
                SELECT 1 FROM training_progress tp
                WHERE tp.user_id = u.id
                  AND tp.module_id = tm.module_id
                  AND tp.status = 'COMPLETED'
              )
            )
            UNION ALL
            SELECT 'Quiz' AS pending_item
            WHERE EXISTS (
              SELECT 1 FROM training_modules tm
              WHERE tm.is_active = TRUE
              AND NOT EXISTS (
                SELECT 1 FROM quiz_attempts qa
                INNER JOIN quizzes q ON q.quiz_id = qa.quiz_id
                WHERE qa.user_id = u.id
                  AND q.module_id = tm.module_id
                  AND qa.passed = TRUE
              )
            )
          ) x
        ),
        ARRAY[]::text[]
      ) AS pending
    FROM users u
    WHERE u.is_active = TRUE AND u.role = 'employee'
    ORDER BY u.name
    `
  );

  return result.rows
    .filter((r) => r.pending && r.pending.length > 0)
    .map((r) => ({
      id: r.id,
      name: r.name,
      pending: r.pending,
    }));
}

module.exports = {
  getMyCompliance,
  getOverview,
  getPending,
};