import rateLimit from 'express-rate-limit';
import { config } from '../config';

// General API rate limiter - Environment-aware
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.floor(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: () => !config.rateLimit.enabled, // Skip rate limiting if disabled
  skipSuccessfulRequests: false, // Count all requests
});

// Strict limiter for sensitive operations - Environment-aware
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many attempts. Please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled, // Skip rate limiting if disabled
  skipSuccessfulRequests: false,
});

// Emergency broadcast limiter - Environment-aware
export const broadcastLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 broadcasts per hour
  message: {
    error: 'Too many emergency broadcasts. Please wait before sending another alert.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled, // Skip rate limiting if disabled
  skipSuccessfulRequests: false,
});

// Auth limiter - Environment-aware
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    error: 'Too many login attempts. Please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled, // Skip rate limiting if disabled
  skipSuccessfulRequests: false,
});

// Data export limiter - Environment-aware
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 exports per hour
  message: {
    error: 'Too many data export requests. Please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled, // Skip rate limiting if disabled
  skipSuccessfulRequests: false,
});

// Account deletion limiter - Environment-aware
export const deletionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1, // Limit each IP to 1 deletion per day
  message: {
    error: 'Account deletion limit reached. Please contact support if you need assistance.',
    retryAfter: 86400
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled, // Skip rate limiting if disabled
  skipSuccessfulRequests: false,
});
