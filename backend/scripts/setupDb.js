const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setup() {
  const rootClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });
  await rootClient.connect();

  const dbs = await rootClient.query("SELECT 1 FROM pg_database WHERE datname = 'xenosys_isa'");
  if (dbs.rowCount === 0) {
    console.log('Creating database xenosys_isa...');
    await rootClient.query('CREATE DATABASE xenosys_isa');
  } else {
    console.log('Database xenosys_isa already exists');
  }
  await rootClient.end();

  const isaClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'xenosys_isa'
  });
  await isaClient.connect();

  const roleRes = await isaClient.query("SELECT 1 FROM pg_roles WHERE rolname = 'xenosys_app'");
  if (roleRes.rowCount === 0) {
    console.log('Creating role xenosys_app...');
    await isaClient.query("CREATE ROLE xenosys_app LOGIN PASSWORD 'CHANGE_ME'");
  } else {
    console.log('Role xenosys_app already exists, setting password...');
    await isaClient.query("ALTER ROLE xenosys_app WITH PASSWORD 'CHANGE_ME'");
  }

  const sqlFiles = [
    { file: path.join(__dirname, '../../database/01_auth.sql'), table: 'users' },
    { file: path.join(__dirname, '../../database/02_password_reset.sql'), table: 'password_reset_requests' },
    { file: path.join(__dirname, '../../database/02_policy.sql'), table: 'policies' },
    { file: path.join(__dirname, '../../database/04_compliance.sql'), table: 'compliance_snapshots' }
  ];

  for (const { file, table } of sqlFiles) {
    if (fs.existsSync(file)) {
      const tableCheck = await isaClient.query(
        "SELECT 1 FROM information_schema.tables WHERE table_name = $1",
        [table]
      );
      if (tableCheck.rowCount === 0) {
        console.log(`Executing ${path.basename(file)} for table ${table}...`);
        let sql = fs.readFileSync(file, 'utf8');
        sql = sql.replace(/CREATE ROLE xenosys_app[^;]+;/g, '-- CREATE ROLE handled');
        await isaClient.query(sql);
        console.log('Executed successfully:', path.basename(file));
      } else {
        console.log(`Table ${table} already exists.`);
      }
    }
  }

  await isaClient.end();
  console.log('Database setup complete.');
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
