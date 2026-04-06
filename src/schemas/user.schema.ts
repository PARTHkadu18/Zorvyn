import { z } from "zod";

const idParam = z.object({
  id: z.string().min(1, "ID is required").regex(/^\d+$/, "ID must be a number"),
});

export const updateRoleSchema = z.object({
  params: idParam,
  body: z.object({
    role: z.enum(["VIEWER", "ANALYST", "ADMIN"]),
  }),
});

export const updateStatusSchema = z.object({
  params: idParam,
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),
});
