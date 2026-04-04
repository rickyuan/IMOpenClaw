/**
 * Global Error Handling Middleware
 */

import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(`[Error] ${err.message}`, err.stack);

  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

  res.status(500).json({
    error: isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}
