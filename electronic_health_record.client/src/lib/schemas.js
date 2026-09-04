import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine((v) => v.newPassword === v.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((v) => v.newPassword !== v.currentPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export const vitalsObjectSchema = z.object({
  weightKg: z.coerce.number({ invalid_type_error: 'Required' })
    .min(1, 'Too low').max(400, 'Too high'),
  heightCm: z.coerce.number({ invalid_type_error: 'Required' })
    .min(30, 'Too low').max(250, 'Too high'),
  bpSystolic: z.coerce.number().int('Whole number').min(50, 'Too low').max(300, 'Too high'),
  bpDiastolic: z.coerce.number().int('Whole number').min(30, 'Too low').max(200, 'Too high'),
  tempCelsius: z.coerce.number().min(30, 'Too low').max(45, 'Too high'),
  heartRate: z.coerce.number().int('Whole number').min(20, 'Too low').max(250, 'Too high'),
  respRate: z.coerce.number().int('Whole number').min(5, 'Too low').max(60, 'Too high'),
});

export const vitalsSchema = vitalsObjectSchema.refine((v) => v.bpDiastolic < v.bpSystolic, {
  message: 'Diastolic must be lower than systolic',
  path: ['bpDiastolic'],
});

export const identitySchema = z.object({
  externalEmployeeId: z.string().min(1, 'Select an employee'),
  surname: z.string().min(1, 'Required'),
  firstName: z.string().min(1, 'Required'),
  middleName: z.string().optional().or(z.literal('')),
  birthdate: z.string().min(1, 'Required'),
  sex: z.string().min(1, 'Required'),
  civilStatus: z.string().min(1, 'Required'),
  address: z.string().optional().or(z.literal('')),
  agencyOffice: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  contactNo: z.string().optional().or(z.literal('')),
});

export const station1Schema = identitySchema.merge(vitalsObjectSchema)
  .refine((v) => v.bpDiastolic < v.bpSystolic, {
    message: 'Diastolic must be lower than systolic',
    path: ['bpDiastolic'],
  });
