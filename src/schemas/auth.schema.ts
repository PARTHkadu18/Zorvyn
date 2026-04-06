import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string(),
    role: z.enum(["VIEWER", "ANALYST", "ADMIN"]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});
