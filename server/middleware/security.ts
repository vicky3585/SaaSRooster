import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import type { Express } from 'express';

/**
 * Configure rate limiting for API endpoints
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health check
  skip: (req) => req.path === '/api/health',
});

/**
 * Configure stricter rate limiting for authentication endpoints
 * 
 * DEVELOPMENT: 50 attempts per 15 minutes (more lenient for testing)
 * PRODUCTION: 5 attempts per 15 minutes (strict security)
 * 
 * NOTE: This is an in-memory rate limiter. To clear rate limits:
 * 1. Restart the application
 * 2. Wait for the 15-minute window to expire
 * 3. Use Redis for persistent rate limiting in production clusters
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Development: 50 attempts, Production: 5 attempts
  message: {
    error: 'Too many login attempts, please try again after 15 minutes.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Configure CORS
 */
export function setupCors(): any {
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5000')
    .split(',')
    .map(origin => origin.trim());

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Trial-Days-Left',
      'X-Trial-Expiring',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 86400, // 24 hours
  });
}

/**
 * Configure security headers using Helmet
 */
export function setupHelmet(): any {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // For React dev
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://api.resend.com'],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny', // Prevent clickjacking
    },
    noSniff: true, // Prevent MIME type sniffing
    xssFilter: true, // Enable XSS filter
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  });
}

/**
 * Apply all security middleware to Express app
 */
export function setupSecurity(app: Express) {
  // Security headers
  app.use(setupHelmet());

  // CORS
  app.use(setupCors());

  // Rate limiting for all API routes
  app.use('/api', rateLimiter);

  // Stricter rate limiting for auth routes
  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/signup', authRateLimiter);
  app.use('/api/admin/auth/login', authRateLimiter);

  // Trust proxy (if behind reverse proxy like Nginx)
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  console.log('✓ Security middleware configured');
  console.log(`  - Rate limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 60000} minutes`);
  console.log(`  - CORS origins: ${process.env.CORS_ORIGINS || 'http://localhost:5000'}`);
  console.log(`  - Auth rate limit: ${process.env.NODE_ENV === 'production' ? '5' : '50'} attempts per 15 minutes (${process.env.NODE_ENV || 'development'} mode)`);
}
