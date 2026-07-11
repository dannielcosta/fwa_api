import { z } from 'zod'

export const signupSchema = z.object({
  email: z.email('Email inválido.'),
  password: z.string().min(8, 'A password deve ter pelo menos 8 caracteres.'),
  firstName: z.string().trim().min(1, 'Nome obrigatório.'),
  lastName: z.string().trim().min(1, 'Apelido obrigatório.'),
  phoneNumber: z.string().trim().optional(),
  address: z.string().trim().optional(),
  birthDate: z.coerce.date().optional(),
  nationality: z.string().trim().optional(),
  nif: z.string().trim().optional(),
  weight: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
})
export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.email('Email inválido.'),
  password: z.string().min(1, 'Password obrigatória.'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.email('Email inválido.'),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório.'),
  newPassword: z.string().min(8, 'A password deve ter pelo menos 8 caracteres.'),
})
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password atual obrigatória.'),
  newPassword: z.string().min(8, 'A nova password deve ter pelo menos 8 caracteres.'),
})
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
