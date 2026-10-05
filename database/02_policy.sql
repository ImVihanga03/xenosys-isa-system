-- Policies & Policy Acknowledgements (Person 2)
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'General Security',
  summary TEXT,
  content TEXT NOT NULL,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_acknowledgements (
  id SERIAL PRIMARY KEY,
  policy_id INT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_version VARCHAR(20) NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address VARCHAR(64),
  user_agent VARCHAR(255),
  CONSTRAINT uq_policy_user_ack UNIQUE (policy_id, user_id)
);

CREATE INDEX IF NOT EXISTS policy_acks_user_idx ON policy_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS policy_acks_policy_idx ON policy_acknowledgements(policy_id);

-- Permissions for xenosys_app
GRANT SELECT, INSERT, UPDATE, DELETE ON policies TO xenosys_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON policy_acknowledgements TO xenosys_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO xenosys_app;

-- Seed default initial security policies
INSERT INTO policies (title, category, summary, content, version, is_mandatory)
SELECT 'Acceptable Use Policy (AUP)', 'Compliance & Conduct', 'Guidelines for acceptable and responsible use of corporate IT equipment, network, and cloud services.', 
'# Xenosys Acceptable Use Policy (AUP)

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
Violations of this policy may result in disciplinary action up to and including termination of employment and possible legal proceedings.', '1.0', TRUE
WHERE NOT EXISTS (SELECT 1 FROM policies WHERE title = 'Acceptable Use Policy (AUP)');

INSERT INTO policies (title, category, summary, content, version, is_mandatory)
SELECT 'Password & Authentication Standard', 'Access Control', 'Requirements for strong passwords, MFA authentication, and credential confidentiality.',
'# Xenosys Password & Authentication Policy

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
- Employees must use the approved enterprise password manager for storing work-related credentials.', '1.0', TRUE
WHERE NOT EXISTS (SELECT 1 FROM policies WHERE title = 'Password & Authentication Standard');

INSERT INTO policies (title, category, summary, content, version, is_mandatory)
SELECT 'Data Classification & Protection Policy', 'Data Privacy', 'Standards for classifying confidential company assets, customer information, and handling sensitive data.',
'# Data Classification & Protection Policy

## 1. Classification Levels
Information assets at Xenosys are categorized into four tiers:
1. **Public**: Information cleared for unrestricted public distribution.
2. **Internal**: General business operational data intended for internal staff.
3. **Confidential**: Proprietary business data, financial records, client projects, and employee records.
4. **Restricted**: Highly sensitive credentials, cryptographic keys, personal identifiable information (PII), and intellectual property.

## 2. Handling & Storage Rules
- Restricted and Confidential data must always be encrypted at rest (AES-256) and in transit (TLS 1.3).
- Sensitive documents must not be transferred using personal email addresses or unauthorized cloud drives (e.g. personal Dropbox or Google Drive).
- Data disposal must follow secure destruction procedures to prevent data recovery.', '1.0', TRUE
WHERE NOT EXISTS (SELECT 1 FROM policies WHERE title = 'Data Classification & Protection Policy');

INSERT INTO policies (title, category, summary, content, version, is_mandatory)
SELECT 'Incident Response & Breach Notification Policy', 'Incident Management', 'Protocol for identifying, reporting, and responding to cyber security incidents and potential breaches.',
'# Incident Response & Breach Notification Policy

## 1. Incident Definition
A security incident is any unauthorized access, loss, alteration, or disruption affecting Xenosys systems, networks, devices, or data integrity.

## 2. Immediate Reporting Obligations
- Any employee who suspects phishing, malware infection, unauthorized account activity, or lost hardware must report it to **security@xenosys.internal** within 1 hour.
- Do not attempt to investigate, delete logs, or reboot infected systems unless instructed by the Incident Response Team.

## 3. Communication Protocol
- Internal details regarding ongoing security investigations must remain confidential and should not be discussed on public forums or social media.', '1.0', TRUE
WHERE NOT EXISTS (SELECT 1 FROM policies WHERE title = 'Incident Response & Breach Notification Policy');
