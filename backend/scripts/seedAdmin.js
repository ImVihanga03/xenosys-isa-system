const bcrypt = require('bcrypt');
const { pool } = require('../src/db/pool');
const { checkPassword } = require('../src/modules/auth/passwordPolicy');

(async () => {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.log('Usage: npm run seed:admin -- "Full Name" admin@xenosys.lk "LongPassword..."');
    process.exit(1);
  }
  const errs = checkPassword(password, { email });
  if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
  await pool.query(
    `INSERT INTO users (name,email,password_hash,role,must_change_password)
     VALUES ($1,$2,$3,'admin',true) ON CONFLICT (email) DO NOTHING`,
    [name, email.toLowerCase(), await bcrypt.hash(password, 12)]);
  console.log('Admin ready'); await pool.end();
})();