const COMMON = ['password','qwerty','letmein','welcome','admin','iloveyou','123456',
                'abc123','xenosys','monkey','dragon','football','sunshine','login'];

exports.checkPassword = (pw, { email } = {}) => {
  const errors = [];
  const lower = pw.toLowerCase();
  if (pw.length < 12) errors.push('Must be at least 12 characters');
  if (Buffer.byteLength(pw) > 72) errors.push('Must be at most 72 characters');   // bcrypt limit
  if (COMMON.some(w => lower.includes(w))) errors.push('Contains a common or easily guessed word');
  const local = email ? email.split('@')[0].toLowerCase() : '';
  if (local.length >= 4 && lower.includes(local)) errors.push('Must not contain your email name');
  return errors;
};