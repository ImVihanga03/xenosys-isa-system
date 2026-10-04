const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const cfg = require('../src/config/env');
const { pool, query } = require('../src/db/pool');

const PW = 'Correct-Horse-Battery-9';
const U = { emp: 'test.employee@xenosys.test', adm: 'test.admin@xenosys.test', lock: 'test.lock@xenosys.test' };
const ROLE = { [U.emp]: 'employee', [U.adm]: 'admin', [U.lock]: 'employee' };

beforeAll(async () => {
  const hash = await bcrypt.hash(PW, 4);
  for (const email of Object.values(U))
    await query(
      `INSERT INTO users (name,email,password_hash,role,must_change_password)
       VALUES ('Test User',$1,$2,$3,false)
       ON CONFLICT (email) DO UPDATE SET password_hash=$2, role=$3, is_active=true,
         must_change_password=false, failed_attempts=0, locked_until=NULL`,
      [email, hash, ROLE[email]]);
});
afterAll(() => pool.end());

const login = (email, password = PW) => request(app).post('/api/auth/login').send({ email, password });

test('wrong password and unknown email give the same generic error', async () => {
  const a = await login(U.emp, 'wrong-password-123');
  const b = await login('nobody@xenosys.test', 'wrong-password-123');
  expect(a.status).toBe(401); expect(b.status).toBe(401);
  expect(a.body.message).toBe(b.body.message);
});

test('login sets an HttpOnly SameSite=Strict cookie and /me works', async () => {
  const res = await login(U.emp);
  expect(res.status).toBe(200);
  const cookie = res.headers['set-cookie'][0];
  expect(cookie).toMatch(/HttpOnly/i); expect(cookie).toMatch(/SameSite=Strict/i);
  const me = await request(app).get('/api/auth/me').set('Cookie', res.headers['set-cookie']);
  expect(me.body.user.email).toBe(U.emp);
  expect(me.body.user).not.toHaveProperty('password');
  expect(me.body.user).not.toHaveProperty('password_hash');
  expect(me.body.user).not.toHaveProperty('currentPassword');
  expect(me.body.user).not.toHaveProperty('newPassword');
});

test('no cookie -> 401', async () => {
  expect((await request(app).get('/api/auth/me')).status).toBe(401);
});

test('employee gets 403 on admin API, admin gets 200', async () => {
  const e = await login(U.emp), a = await login(U.adm);
  expect((await request(app).get('/api/admin/users').set('Cookie', e.headers['set-cookie'])).status).toBe(403);
  expect((await request(app).get('/api/admin/users').set('Cookie', a.headers['set-cookie'])).status).toBe(200);
});

test('account locks after 5 failures, even the right password is refused', async () => {
  for (let i = 0; i < 5; i++) await login(U.lock, 'wrong-password-123');
  expect((await login(U.lock)).status).toBe(401);
});

test('old token is rejected after logout', async () => {
  const res = await login(U.emp);
  const cookie = res.headers['set-cookie'];
  await request(app).post('/api/auth/logout').set('Cookie', cookie);
  expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
});

test('expired token is rejected', async () => {
  const { rows } = await query('SELECT id, token_version FROM users WHERE email=$1', [U.emp]);
  const t = jwt.sign({ tv: rows[0].token_version }, cfg.jwtSecret,
                     { subject: String(rows[0].id), expiresIn: -10 });
  expect((await request(app).get('/api/auth/me').set('Cookie', `token=${t}`)).status).toBe(401);
});

test('weak new password is rejected', async () => {
  const res = await login(U.emp);
  const r = await request(app).post('/api/auth/change-password')
    .set('Cookie', res.headers['set-cookie']).send({ currentPassword: PW, newPassword: 'password1234' });
  expect(r.status).toBe(400);
});

test('login and logout are written to audit_logs', async () => {
  const { rows } = await query(
    `SELECT DISTINCT action FROM audit_logs WHERE actor_email=$1`, [U.emp]);
  const actions = rows.map(r => r.action);
  expect(actions).toEqual(expect.arrayContaining(['LOGIN_SUCCESS', 'LOGOUT', 'LOGIN_FAILED']));
});