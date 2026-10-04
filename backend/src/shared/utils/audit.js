const { query } = require('../../db/pool');

async function audit(req, action, resource, outcome, extra = {}) {
  try {
    await query(
      `INSERT INTO audit_logs (actor_id, actor_email, action, resource, outcome, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [extra.actorId ?? req.user?.id ?? null,
       extra.actorEmail ?? req.user?.email ?? null,
       action, resource ?? null, outcome, req.ip,
       (req.get('user-agent') || '').slice(0, 255)]);
  } catch (err) { console.error('AUDIT_WRITE_FAILED:', err.message); }
}
module.exports = { audit };