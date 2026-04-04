/**
 * Rate Limiting Middleware
 *
 * Protects API endpoints from abuse. Different limits for different endpoints.
 */

import rateLimit from 'express-rate-limit';

/** IM callback: generous limit (IM server retries, multiple users) */
export const callbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Too many callback requests, please try again later.' },
});

/** Voice start: strict limit per user */
export const voiceStartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Too many voice start requests, please wait.' },
  keyGenerator: (req) => req.body?.userId || 'unknown',
});

/** Model/agent selection: moderate limit */
export const selectionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Too many selection requests.' },
  keyGenerator: (req) => req.body?.userId || req.query?.userId as string || 'unknown',
});
