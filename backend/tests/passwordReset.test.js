jest.mock('../src/shared/utils/mailer', () => ({ sendMail: jest.fn().mockResolvedValue() }));
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { pool, query } = require('../src/db/pool');
const { sendMail } = require('../src/shared/utils/mailer');

const OLD = 'Correct-Horse-Battery-9';
const NEW = 'Another-Strong-Phrase-77';
const run = Date.now();
const mk = (n) => `reset.${run}.${n}@xenosys.test`;

beforeAll(async () => {
  const hash = await bcrypt.hash(OLD, 4);
  for (const n of ['a', 'b', 'c', 'd'])
    await query(`INSERT INTO users (name,email,password_hash,role,must_change_password)
                 VALUES ('Reset Tester',$1,$2,'employee',false)`, [mk(n), hash]);
});
afterAll(() => pool.end());

const forgot = (email) => request(app).post('/api/auth/forgot-password').send({ email });
const verify = (email, code) => request(app).post('/api/auth/verify-reset-code').send({ email, code });
const sentCode = (email) => sendMail.mock.calls.map(c => c[0])
  .filter(m => m.to === email && /reset code/i.test(m.subject)).pop().text.match(/\b\d{6}\b/)[0];

test('same response for registered and unknown emails', async () => {
  const a = await forgot(mk('a'));
  const b = await forgot('nobody.' + run + '@xenosys.test');
  expect(a.status).toBe(200); expect(b.status).toBe(200);
  expect(a.body).toEqual(b.body);
  expect((await forgot('not-an-email')).status).toBe(400);   // format validation
});

test('full flow: code -> verify -> reset -> old password dead, new works, sessions killed', async () => {
  const email = mk('b');
  const oldSession = (await request(app).post('/api/auth/login').send({ email, password: OLD })).headers['set-cookie'];
  await forgot(email);
  const v = await verify(email, sentCode(email));
  expect(v.status).toBe(200);
  const cookies = v.headers['set-cookie'];
  expect(cookies[0]).toMatch(/HttpOnly/i);

  const bad = await request(app).post('/api/auth/reset-password').set('Cookie', cookies)
    .send({ newPassword: 'password1234', confirmPassword: 'password1234' });
  expect(bad.status).toBe(400);                                      // policy applies
  const mismatch = await request(app).post('/api/auth/reset-password').set('Cookie', cookies)
    .send({ newPassword: NEW, confirmPassword: NEW + 'x' });
  expect(mismatch.status).toBe(400);                                 // confirmation must match

  const ok = await request(app).post('/api/auth/reset-password').set('Cookie', cookies)
    .send({ newPassword: NEW, confirmPassword: NEW });
  expect(ok.status).toBe(200);

  expect((await request(app).post('/api/auth/login').send({ email, password: OLD })).status).toBe(401);
  expect((await request(app).post('/api/auth/login').send({ email, password: NEW })).status).toBe(200);
  expect((await request(app).get('/api/auth/me').set('Cookie', oldSession)).status).toBe(401);
  // reset credential is single-use
  expect((await request(app).post('/api/auth/reset-password').set('Cookie', cookies)
    .send({ newPassword: NEW + '1', confirmPassword: NEW + '1' })).status).toBe(400);
});

test('code is single-use and wrong codes are limited to 5 attempts', async () => {
  const email = mk('c');
  await forgot(email);
  const good = sentCode(email);
  const wrong = good === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) expect((await verify(email, wrong)).status).toBe(400);
  expect((await verify(email, good)).status).toBe(400);              // correct code, but attempts used up
});

test('verified code cannot be reused; reset events are audited', async () => {
  const email = mk('d');
  await forgot(email);
  const code = sentCode(email);
  expect((await verify(email, code)).status).toBe(200);
  expect((await verify(email, code)).status).toBe(400);
  const { rows } = await query(`SELECT DISTINCT action FROM audit_logs WHERE actor_email=$1`, [email]);
  expect(rows.map(r => r.action)).toEqual(expect.arrayContaining(
    ['PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_CODE_VERIFIED', 'PASSWORD_RESET_CODE_FAILED']));
});