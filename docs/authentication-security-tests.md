# Authentication & RBAC Security Testing

## 1. Overview

Manual testing was performed on the Xenosys-ISA backend to verify authentication, password security, RBAC, audit logging, session invalidation, and account lockout.

---

## 2. Test Environment

| Component        | Configuration           |
| ---------------- | ----------------------- |
| Backend          | Node.js + Express       |
| Database         | PostgreSQL              |
| Authentication   | JWT + HttpOnly cookie   |
| Password hashing | bcrypt                  |
| Validation       | Zod                     |
| RBAC             | Admin / Employee        |
| Audit logging    | PostgreSQL              |
| Session lifetime | 30 minutes              |
| Lockout          | 5 attempts / 15 minutes |

---

## 3. Security Test Results

| ID      | Security Test         | Expected Result            | Actual Result              | Status |
| ------- | --------------------- | -------------------------- | -------------------------- | ------ |
| AUTH-01 | Database connectivity | Restricted DB user used    | `xenosys_app` confirmed    | PASS   |
| AUTH-02 | Backend health        | API responds with HTTP 200 | HTTP 200                   | PASS   |
| AUTH-03 | Admin seed            | Administrator created      | Admin created successfully | PASS   |
| AUTH-04 | Admin login           | Valid credentials accepted | HTTP 200                   | PASS   |
| AUTH-05 | Authentication cookie | Secure cookie issued       | HttpOnly/SameSite cookie   | PASS   |
| AUTH-06 | `/api/auth/me`        | Valid session accepted     | HTTP 200                   | PASS   |
| AUTH-07 | Password change       | Change required            | Requirement enforced       | PASS   |
| AUTH-08 | Password hashing      | No plaintext passwords     | bcrypt used                | PASS   |
| AUTH-09 | Password policy       | Policy enforced            | Policy implemented         | PASS   |
| AUTH-10 | Admin RBAC            | Admin access allowed       | HTTP 200                   | PASS   |
| AUTH-11 | Employee RBAC         | Admin access denied        | HTTP 403                   | PASS   |
| AUTH-12 | Audit logging         | Security events recorded   | Events recorded            | PASS   |
| AUTH-13 | Logout                | Session cookie cleared     | Cookie cleared             | PASS   |
| AUTH-14 | Session invalidation  | Old JWT rejected           | HTTP 401                   | PASS   |
| AUTH-15 | Account lockout       | 5 failures trigger lock    | Account locked             | PASS   |
| AUTH-16 | Login while locked    | Login rejected             | HTTP 401                   | PASS   |
| AUTH-17 | Lockout audit         | Lockout recorded           | `ACCOUNT_LOCKED` recorded  | PASS   |

---

## 4. Key Security Verification

### 4.1 Authentication

Valid administrator credentials successfully authenticated through:

```text
POST /api/auth/login
```

The server returned HTTP `200 OK` and issued a JWT cookie with:

```text
HttpOnly
SameSite=Strict
Max-Age=1800
```

The authenticated session was also successfully verified through:

```text
GET /api/auth/me
```

---

### 4.2 Password Security

Passwords are stored as bcrypt hashes in `password_hash` rather than plaintext.

The password policy includes:

* Minimum 12 characters
* Maximum 72 bytes
* Common-password protection
* Email-name protection
* New password must differ from the current password

Initial administrator accounts require a password change using `must_change_password`.

---

### 4.3 RBAC

An administrator successfully accessed:

```text
GET /api/admin/users
```

with HTTP `200 OK`.

An employee attempting the same endpoint received HTTP `403 Forbidden`, confirming server-side RBAC enforcement.

---

### 4.4 Session Invalidation

The application uses `token_version` to invalidate existing JWT sessions.

The JWT version is compared with `users.token_version`. After invalidation, an old JWT was rejected with:

```text
HTTP 401 Unauthorized
```

This prevents a previously issued token from remaining valid after session invalidation.

---

### 4.5 Account Lockout

The authentication system locks an account after:

```text
5 failed attempts
15-minute lock duration
```

After the account was locked, even the correct password was rejected with HTTP `401 Unauthorized`.

---

### 4.6 Audit Logging

The following security events were verified in the PostgreSQL audit log:

* `LOGIN_SUCCESS`
* `LOGIN_FAILED`
* `ACCESS_DENIED`
* `PASSWORD_CHANGED`
* `ACCOUNT_LOCKED`

---

## 6. Security Test Status

**Manual Authentication & RBAC Security Testing: PASS**

Manual testing successfully verified authentication, password security, authorization, audit logging, logout, session invalidation, and account lockout.
