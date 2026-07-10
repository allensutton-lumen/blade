import type { NextFunction, Request, Response } from 'express';
import { body, matchedData, param, query, validationResult } from 'express-validator';
export { body, matchedData, param, query, validationResult };

export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ status: 'error', message: 'Validation failed', errors: errors.array().map((error) => ({ field: 'path' in error ? error.path : 'unknown', message: error.msg })) });
    return;
  }
  next();
}
