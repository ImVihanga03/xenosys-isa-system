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
    `INSERT INTO users (name,email,password_hash,role,must_change_password,failed_attempts,locked_until,is_active)
     VALUES ($1,$2,$3,'admin',false,0,null,true)
     ON CONFLICT (email) DO UPDATE 
     SET password_hash = EXCLUDED.password_hash,
         role = 'admin',
         failed_attempts = 0,
         locked_until = null,
         is_active = true,
         must_change_password = false`,
    [name, email.toLowerCase(), await bcrypt.hash(password, 12)]);
  console.log('Admin ready'); await pool.end();
})();