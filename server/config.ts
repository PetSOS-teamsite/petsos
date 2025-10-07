/**
 * Environment-specific configuration management
 * 
 * Supports multiple environments: development, staging, production
 * Provides type-safe access to configuration values
 */

export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  env: Environment;
  port: number;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  
  // Database
  database: {
    url: string;
  };
  
  // Session
  session: {
    secret: string;
    secure: boolean;
    maxAge: number;
  };
  
  // Authentication
  auth: {
    replitDomains: string;
  };
  
  // Rate Limiting
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  
  // Monitoring
  monitoring: {
    sentryDsn?: string;
    sentryTracesSampleRate: number;
    sentryEnv: string;
  };
  
  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Get current environment from NODE_ENV
 */
export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV?.toLowerCase() || 'development';
  
  if (env === 'production' || env === 'prod') return 'production';
  if (env === 'staging' || env === 'stage') return 'staging';
  return 'development';
}

/**
 * Load configuration for current environment
 */
export function loadConfig(): AppConfig {
  const env = getEnvironment();
  const isDevelopment = env === 'development';
  const isStaging = env === 'staging';
  const isProduction = env === 'production';
  
  // In development, warn about missing required variables
  if (isDevelopment) {
    if (!process.env.DATABASE_URL) {
      console.warn('[Config] DATABASE_URL not set - database features will not work');
    }
    if (!process.env.REPLIT_DOMAINS) {
      console.warn('[Config] REPLIT_DOMAINS not set - authentication will not work');
    }
    if (!process.env.SESSION_SECRET) {
      console.warn('[Config] SESSION_SECRET not set - using default (insecure for production)');
    }
  } else {
    // In staging/production, require all critical variables
    const requiredVars = ['DATABASE_URL', 'REPLIT_DOMAINS', 'SESSION_SECRET'];
    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for ${env}: ${missing.join(', ')}`);
    }
  }
  
  // Base configuration
  const config: AppConfig = {
    env,
    port: parseInt(process.env.PORT || '5000', 10),
    isDevelopment,
    isStaging,
    isProduction,
    
    database: {
      // Use empty string in development if not set, otherwise it's guaranteed to exist
      url: process.env.DATABASE_URL || (isDevelopment ? '' : process.env.DATABASE_URL!),
    },
    
    session: {
      secret: process.env.SESSION_SECRET || (isDevelopment ? 'dev-secret-change-in-production' : process.env.SESSION_SECRET!),
      secure: isProduction || isStaging, // HTTPS only in staging/production
      maxAge: isProduction ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000, // 7 days prod, 30 days dev
    },
    
    auth: {
      // Use empty string in development if not set, otherwise it's guaranteed to exist
      replitDomains: process.env.REPLIT_DOMAINS || (isDevelopment ? '' : process.env.REPLIT_DOMAINS!),
    },
    
    rateLimit: {
      enabled: !isDevelopment, // Disable in development for easier testing
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: isProduction ? 100 : 1000, // Stricter in production
    },
    
    monitoring: {
      sentryDsn: process.env.SENTRY_DSN,
      sentryTracesSampleRate: isProduction ? 0.1 : 1.0,
      sentryEnv: env,
    },
    
    logging: {
      level: isDevelopment ? 'debug' : isProduction ? 'warn' : 'info',
    },
  };
  
  // Log configuration on startup (excluding sensitive data)
  console.log(`[Config] Environment: ${env}`);
  console.log(`[Config] Port: ${config.port}`);
  console.log(`[Config] Rate limiting: ${config.rateLimit.enabled ? 'enabled' : 'disabled'}`);
  console.log(`[Config] Session secure cookies: ${config.session.secure}`);
  console.log(`[Config] Sentry monitoring: ${config.monitoring.sentryDsn ? 'enabled' : 'disabled'}`);
  
  return config;
}

// Export singleton config instance
export const config = loadConfig();
