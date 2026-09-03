import { z } from 'zod';
import { ROLES } from './constants';

export const loginSchema = z.object({
  role: z.enum([ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT]),
  identifier: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});

export const vitalsSchema = z.object({
  weightKg: z.coerce.number({ invalid_type_error: 'Required' })
    .min(1, 'Too low').max(400, 'Too high'),
  heightCm: z.coerce.number({ invalid_type_error: 'Required' })
    .min(30, 'Too low').max(250, 'Too high'),
  bpSystolic: z.coerce.number().int('Whole number').min(50, 'Too low').max(300, 'Too high'),
  bpDiastolic: z.coerce.number().int('Whole number').min(30, 'Too low').max(200, 'Too high'),
  tempCelsius: z.coerce.number().min(30, 'Too low').max(45, 'Too high'),
  heartRate: z.coerce.number().int('Whole number').min(20, 'Too low').max(250, 'Too high'),
  respRate: z.coerce.number().int('Whole number').min(5, 'Too low').max(60, 'Too high'),
}).refine((v) => v.bpDiastolic < v.bpSystolic, {
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

export const station1Schema = z.intersection(identitySchema, vitalsSchema);
