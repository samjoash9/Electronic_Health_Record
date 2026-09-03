import { z } from 'zod';
import { ROLES } from './constants';

export const loginSchema = z.object({
  role: z.enum([ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT]),
  identifier: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});
