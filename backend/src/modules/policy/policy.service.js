const { query } = require('../../db/pool');

// Default initial policies fallback in case DB table is not yet migrated
let memoryPolicies = [
  {
    id: 1,
    title: 'Acceptable Use Policy (AUP)',
    category: 'Compliance & Conduct',
    summary: 'Guidelines for acceptable and responsible use of corporate IT equipment, network, and cloud services.',
    content: `# Xenosys Acceptable Use Policy (AUP)

## 1. Purpose & Scope
This policy outlines the acceptable use of company-owned computing equipment, network infrastructure, data repositories, and internet access provided by Xenosys. All employees, contractors, and affiliates must adhere to these guidelines to ensure information security and system integrity.

## 2. General Principles
- Systems and accounts provided by Xenosys are intended for legitimate business purposes.
- Users must not use company resources for unlawful activities, commercial ventures outside Xenosys, or transmitting offensive or harassing material.
- Incidental, non-disruptive personal use is permissible provided it does not violate confidentiality, security standards, or productivity.

## 3. Account Security & Responsibilities
- Users are responsible for safeguarding their login credentials and must never share access tokens or passwords.
- Unattended workstations must be locked using Windows Key + L or screen timeout.
- Any unauthorized access attempts or suspicious network anomalies must be reported immediately to the Information Security team.

## 4. Enforcement & Consequences
Violations of this policy may result in disciplinary action up to and including termination of employment and possible legal proceedings.`,
    version: '1.0',
    is_mandatory: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Password & Authentication Standard',
    category: 'Access Control',
    summary: 'Requirements for strong passwords, MFA authentication, and credential confidentiality.',
    content: `# Xenosys Password & Authentication Policy

## 1. Password Complexity Requirements
All Xenosys domain and application passwords must meet the following minimum criteria:
- Minimum length of 12 characters.
- Must include at least one uppercase letter (A-Z), one lowercase letter (a-z), one numeral (0-9), and one special symbol (@, #, $, %, etc.).
- Passwords must not contain dictionary words, usernames, or easily guessable personal information.

## 2. Multi-Factor Authentication (MFA)
- Multi-Factor Authentication is mandatory for all employee accounts accessing internal systems, VPNs, and email services.
- Authenticator application push notifications or TOTP codes are the primary MFA methods. SMS OTP is restricted to legacy systems only.

## 3. Credential Protection
- Writing down passwords, sharing credentials across teams, or hardcoding secrets in source code is strictly prohibited.
- Employees must use the approved enterprise password manager for storing work-related credentials.`,
    version: '1.0',
    is_mandatory: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Data Classification & Protection Policy',
    category: 'Data Privacy',
    summary: 'Standards for classifying confidential company assets, customer information, and handling sensitive data.',
    content: `# Data Classification & Protection Policy

## 1. Classification Levels
Information assets at Xenosys are categorized into four tiers:
1. **Public**: Information cleared for unrestricted public distribution.
2. **Internal**: General business operational data intended for internal staff.
3. **Confidential**: Proprietary business data, financial records, client projects, and employee records.
4. **Restricted**: Highly sensitive credentials, cryptographic keys, personal identifiable information (PII), and intellectual property.

## 2. Handling & Storage Rules
- Restricted and Confidential data must always be encrypted at rest (AES-256) and in transit (TLS 1.3).
- Sensitive documents must not be transferred using personal email addresses or unauthorized cloud drives (e.g. personal Dropbox or Google Drive).
- Data disposal must follow secure destruction procedures to prevent data recovery.`,
    version: '1.0',
    is_mandatory: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    title: 'Incident Response & Breach Notification Policy',
    category: 'Incident Management',
    summary: 'Protocol for identifying, reporting, and responding to cyber security incidents and potential breaches.',
    content: `# Incident Response & Breach Notification Policy

## 1. Incident Definition
A security incident is any unauthorized access, loss, alteration, or disruption affecting Xenosys systems, networks, devices, or data integrity.

## 2. Immediate Reporting Obligations
- Any employee who suspects phishing, malware infection, unauthorized account activity, or lost hardware must report it to **security@xenosys.internal** within 1 hour.
- Do not attempt to investigate, delete logs, or reboot infected systems unless instructed by the Incident Response Team.

## 3. Communication Protocol
- Internal details regarding ongoing security investigations must remain confidential and should not be discussed on public forums or social media.`,
    version: '1.0',
    is_mandatory: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

let memoryAcks = []; // { policyId, userId, policyVersion, acknowledgedAt, ip, userAgent }

async function listPolicies(userId) {
  try {
    const res = await query(
      `SELECT p.id, p.title, p.category, p.summary, p.content, p.version, p.is_mandatory, p.is_active, p.created_at, p.updated_at,
              pa.acknowledged_at,
              CASE WHEN pa.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_acknowledged
       FROM policies p
       LEFT JOIN policy_acknowledgements pa 
         ON pa.policy_id = p.id AND pa.user_id = $1
       WHERE p.is_active = TRUE
       ORDER BY p.id ASC`,
      [userId]
    );
    return res.rows;
  } catch (err) {
    // Fallback to memory store if DB tables don't exist yet
    return memoryPolicies
      .filter(p => p.is_active)
      .map(p => {
        const ack = memoryAcks.find(a => a.policyId === p.id && a.userId === userId);
        return {
          ...p,
          acknowledged_at: ack ? ack.acknowledgedAt : null,
          is_acknowledged: Boolean(ack)
        };
      });
  }
}

async function listAllPoliciesAdmin() {
  try {
    const res = await query(
      `SELECT p.*,
              COUNT(pa.id)::int AS acknowledgement_count
       FROM policies p
       LEFT JOIN policy_acknowledgements pa ON pa.policy_id = p.id
       GROUP BY p.id
       ORDER BY p.id ASC`
    );
    return res.rows;
  } catch (err) {
    return memoryPolicies.map(p => {
      const count = memoryAcks.filter(a => a.policyId === p.id).length;
      return {
        ...p,
        acknowledgement_count: count
      };
    });
  }
}

async function getPolicyById(id, userId) {
  try {
    const res = await query(
      `SELECT p.*,
              pa.acknowledged_at,
              CASE WHEN pa.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_acknowledged
       FROM policies p
       LEFT JOIN policy_acknowledgements pa 
         ON pa.policy_id = p.id AND pa.user_id = $2
       WHERE p.id = $1`,
      [id, userId]
    );
    return res.rows[0] || null;
  } catch (err) {
    const p = memoryPolicies.find(item => item.id === Number(id));
    if (!p) return null;
    const ack = memoryAcks.find(a => a.policyId === p.id && a.userId === userId);
    return {
      ...p,
      acknowledged_at: ack ? ack.acknowledgedAt : null,
      is_acknowledged: Boolean(ack)
    };
  }
}

async function createPolicy({ title, category, summary, content, version, is_mandatory, created_by }) {
  try {
    const res = await query(
      `INSERT INTO policies (title, category, summary, content, version, is_mandatory, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        category || 'General Security',
        summary || '',
        content,
        version || '1.0',
        is_mandatory !== false,
        created_by || null
      ]
    );
    return res.rows[0];
  } catch (err) {
    const newId = memoryPolicies.length ? Math.max(...memoryPolicies.map(p => p.id)) + 1 : 1;
    const newPolicy = {
      id: newId,
      title,
      category: category || 'General Security',
      summary: summary || '',
      content,
      version: version || '1.0',
      is_mandatory: is_mandatory !== false,
      is_active: true,
      created_by: created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryPolicies.push(newPolicy);
    return newPolicy;
  }
}

async function updatePolicy(id, { title, category, summary, content, version, is_mandatory, is_active }) {
  try {
    const res = await query(
      `UPDATE policies
       SET title = COALESCE($1, title),
           category = COALESCE($2, category),
           summary = COALESCE($3, summary),
           content = COALESCE($4, content),
           version = COALESCE($5, version),
           is_mandatory = COALESCE($6, is_mandatory),
           is_active = COALESCE($7, is_active),
           updated_at = now()
       WHERE id = $8
       RETURNING *`,
      [title, category, summary, content, version, is_mandatory, is_active, id]
    );
    return res.rows[0] || null;
  } catch (err) {
    const idx = memoryPolicies.findIndex(p => p.id === Number(id));
    if (idx === -1) return null;
    const current = memoryPolicies[idx];
    const updated = {
      ...current,
      title: title ?? current.title,
      category: category ?? current.category,
      summary: summary ?? current.summary,
      content: content ?? current.content,
      version: version ?? current.version,
      is_mandatory: is_mandatory ?? current.is_mandatory,
      is_active: is_active ?? current.is_active,
      updated_at: new Date().toISOString()
    };
    memoryPolicies[idx] = updated;
    return updated;
  }
}

async function deletePolicy(id) {
  try {
    const res = await query(
      `DELETE FROM policies WHERE id = $1 RETURNING id`,
      [id]
    );
    return res.rowCount > 0;
  } catch (err) {
    const idx = memoryPolicies.findIndex(p => p.id === Number(id));
    if (idx === -1) return false;
    memoryPolicies.splice(idx, 1);
    memoryAcks = memoryAcks.filter(a => a.policyId !== Number(id));
    return true;
  }
}

async function acknowledgePolicy(policyId, user, ip, userAgent) {
  const polId = Number(policyId);
  const userId = user.id;

  try {
    // 1. Get policy version
    const polRes = await query(`SELECT id, version FROM policies WHERE id = $1 AND is_active = TRUE`, [polId]);
    if (polRes.rowCount === 0) {
      throw new Error('Policy not found or inactive');
    }
    const policyVersion = polRes.rows[0].version;

    // 2. Insert/Update acknowledgement
    const ackRes = await query(
      `INSERT INTO policy_acknowledgements (policy_id, user_id, policy_version, ip_address, user_agent, acknowledged_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (policy_id, user_id) 
       DO UPDATE SET acknowledged_at = now(), policy_version = $3, ip_address = $4, user_agent = $5
       RETURNING *`,
      [polId, userId, policyVersion, ip, userAgent]
    );

    return { success: true, acknowledgement: ackRes.rows[0] };
  } catch (err) {
    // If DB error, fallback
    const pol = memoryPolicies.find(p => p.id === polId && p.is_active);
    if (!pol) {
      throw new Error('Policy not found or inactive');
    }

    const existingIdx = memoryAcks.findIndex(a => a.policyId === polId && a.userId === userId);
    const ackRecord = {
      id: existingIdx >= 0 ? memoryAcks[existingIdx].id : memoryAcks.length + 1,
      policyId: polId,
      userId,
      policyVersion: pol.version,
      acknowledgedAt: new Date().toISOString(),
      ip,
      userAgent
    };

    if (existingIdx >= 0) {
      memoryAcks[existingIdx] = ackRecord;
    } else {
      memoryAcks.push(ackRecord);
    }

    return { success: true, acknowledgement: ackRecord };
  }
}

async function getComplianceStats() {
  try {
    const totalUsersRes = await query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'employee' AND is_active = TRUE`);
    const totalEmployees = totalUsersRes.rows[0]?.count || 1;

    const totalPoliciesRes = await query(`SELECT COUNT(*)::int AS count FROM policies WHERE is_active = TRUE AND is_mandatory = TRUE`);
    const totalMandatoryPolicies = totalPoliciesRes.rows[0]?.count || 1;

    const acksRes = await query(
      `SELECT pa.id, pa.policy_id, pa.user_id, pa.policy_version, pa.acknowledged_at,
              u.name AS user_name, u.email AS user_email, u.department,
              p.title AS policy_title
       FROM policy_acknowledgements pa
       JOIN users u ON u.id = pa.user_id
       JOIN policies p ON p.id = pa.policy_id
       ORDER BY pa.acknowledged_at DESC`
    );

    const totalAcks = acksRes.rows.length;
    const maxPossibleAcks = totalEmployees * totalMandatoryPolicies;
    const complianceRate = maxPossibleAcks > 0 ? Math.min(100, Math.round((totalAcks / maxPossibleAcks) * 100)) : 100;

    return {
      totalEmployees,
      totalPolicies: totalMandatoryPolicies,
      totalAcknowledgements: totalAcks,
      complianceRate,
      recentAcknowledgements: acksRes.rows.slice(0, 20)
    };
  } catch (err) {
    const totalEmployees = 10;
    const totalMandatoryPolicies = memoryPolicies.filter(p => p.is_mandatory && p.is_active).length;
    const totalAcks = memoryAcks.length;
    const complianceRate = Math.round((totalAcks / (totalEmployees * (totalMandatoryPolicies || 1))) * 100);

    return {
      totalEmployees,
      totalPolicies: totalMandatoryPolicies,
      totalAcknowledgements: totalAcks,
      complianceRate: isNaN(complianceRate) ? 0 : complianceRate,
      recentAcknowledgements: memoryAcks.map(a => {
        const pol = memoryPolicies.find(p => p.id === a.policyId);
        return {
          id: a.id,
          policy_id: a.policyId,
          user_id: a.userId,
          user_name: 'Employee',
          user_email: 'employee@xenosys.internal',
          department: 'Engineering',
          policy_title: pol ? pol.title : 'Security Policy',
          policy_version: a.policyVersion,
          acknowledged_at: a.acknowledgedAt
        };
      })
    };
  }
}

module.exports = {
  listPolicies,
  listAllPoliciesAdmin,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  acknowledgePolicy,
  getComplianceStats
};
