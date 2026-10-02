const { z } = require('zod');
const email = z.string().trim().toLowerCase().email().max(255);

exports.loginSchema = z.object({ email, password: z.string().min(1).max(128) });
exports.changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(1).max(128),
});
exports.createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  role: z.enum(['employee', 'admin', 'security_officer']),
  department: z.string().trim().max(100).optional(),
  jobRole: z.string().trim().max(100).optional(),
});