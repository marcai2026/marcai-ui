import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .min(1, "Informe o e-mail.")
  .email("Informe um e-mail válido.");

const passwordField = z
  .string()
  .min(1, "Informe a senha.")
  .min(5, "A senha precisa ter entre 5 e 128 caracteres.")
  .max(128, "A senha precisa ter entre 5 e 128 caracteres.");

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(150, "O nome pode ter no máximo 150 caracteres."),
  email: emailField,
  password: passwordField,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export function firstFieldErrors<T extends string>(error: z.ZodError) {
  const messages: Partial<Record<T, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || field in messages) {
      continue;
    }
    messages[field as T] = issue.message;
  }

  return messages;
}
