import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
         res.status(400).json({
          error: true,
          message: "Validation failed",
          details: error.issues.map((e) => ({ path: e.path.join("."), message: e.message })),
        });
        return;
      }
      next(error);
    }
  };
};
