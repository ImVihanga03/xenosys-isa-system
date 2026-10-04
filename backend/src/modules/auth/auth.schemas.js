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


const code = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code');

exports.forgotPasswordSchema = z.object({ email });
exports.verifyCodeSchema = z.object({ email, code });
exports.resetPasswordSchema = z.object({
  newPassword: z.string().min(1).max(128),
  confirmPassword: z.string().min(1).max(128),
}).refine(d => d.newPassword === d.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] });