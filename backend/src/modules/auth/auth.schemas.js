const { z } = require('zod');
const email = z.string().trim().toLowerCase().email().max(255);
const ROLES = ['employee', 'admin', 'security_officer'];
const text100 = z.string().trim().min(1).max(100);

exports.loginSchema = z.object({ email, password: z.string().min(1).max(128) });
exports.changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(1).max(128),
});

exports.createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  role: z.enum(ROLES),
  department: text100,
  jobRole: text100,
}).strict();

exports.updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  role: z.enum(ROLES),
  department: text100,
  jobRole: text100,
}).partial().strict()
  .refine(o => Object.keys(o).length > 0, { message: 'Provide at least one field to update' });

exports.deleteUserSchema = z.object({ confirmEmail: email }).strict();

exports.listUsersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(['active', 'disabled', 'locked']).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});


const code = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code');

exports.forgotPasswordSchema = z.object({ email });
exports.verifyCodeSchema = z.object({ email, code });
exports.resetPasswordSchema = z.object({
  newPassword: z.string().min(1).max(128),
  confirmPassword: z.string().min(1).max(128),
}).refine(d => d.newPassword === d.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] });