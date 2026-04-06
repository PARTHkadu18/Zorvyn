import { z } from "zod";

export const createRecordSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be positive"),
    type: z.enum(["INCOME", "EXPENSE"]),
    category: z.string().min(1, "Category is required"),
    notes: z.string().optional(),
    date: z.string().optional(), // Should be an ISO date string
  }),
});

export const getRecordsQuerySchema = z.object({
  query: z.object({
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    category: z.string().optional(),
  }).loose(),
});
