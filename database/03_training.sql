-- Training & Quiz tables (integrated with main system)

CREATE TABLE IF NOT EXISTS training_modules (
  module_id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  estimated_time INT DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
  quiz_id SERIAL PRIMARY KEY,
  module_id INT NOT NULL REFERENCES training_modules(module_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  pass_percentage INT NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  question_id SERIAL PRIMARY KEY,
  quiz_id INT NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D'))
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  attempt_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  quiz_id INT NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_progress (
  progress_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  module_id INT NOT NULL REFERENCES training_modules(module_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED'
    CHECK (status IN ('NOT_STARTED','IN_PROGRESS','COMPLETED')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_training_progress_user ON training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Sample data for demo
INSERT INTO training_modules (title, description, content, category, estimated_time)
VALUES
(
  'Password Security Basics',
  'Learn how to create and manage strong passwords.',
  'Strong passwords are your first line of defense. Use at least 12 characters, mix uppercase, lowercase, numbers and symbols. Never reuse passwords across systems. Do not share your password with anyone. Change temporary passwords immediately after first login. Avoid common words like password, admin, or your email name.',
  'Authentication',
  10
),
(
  'Phishing Awareness',
  'Identify and report phishing emails and social engineering attacks.',
  'Phishing emails often create urgency, use suspicious links, or ask for credentials. Always verify the sender address. Hover over links before clicking. Never enter your Xenosys login details on any page other than the official login page. Report suspected phishing immediately to the Security Officer.',
  'Social Engineering',
  15
);

INSERT INTO quizzes (module_id, title, pass_percentage)
VALUES
(1, 'Password Security Quiz', 70),
(2, 'Phishing Awareness Quiz', 70);

INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
(1, 'What is the minimum recommended password length?', '6 characters', '8 characters', '12 characters', '4 characters', 'C'),
(1, 'Should you share your password with IT support?', 'Yes, if they ask', 'Only by email', 'No, never', 'Only once', 'C'),
(1, 'Which is a weak password?', 'Xen0sys#Secure99', 'password123', 'Tr!cky-Horse-Cloud', 'Blue$Sky7River', 'B'),
(2, 'What should you do with a suspicious email link?', 'Click immediately', 'Hover and verify first', 'Forward to friends', 'Reply with password', 'B'),
(2, 'Where should you enter System login credentials?', 'Any page that asks', 'Only official login page', 'In email reply', 'On social media', 'B');