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
  
  // Regional Configuration
  regional: {
    defaultCountry: string;
    defaultCountryCode: string;
    defaultLanguage: string;
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
 * Validate required environment variables for production and staging
 */
function validateEnvironmentVariables(env: Environment): void {
  if (env === 'development') {
    return; // Skip validation in development
  }

  const required: string[] = [];
  const missing: string[] = [];

  if (env === 'production' || env === 'staging') {
    required.push('DATABASE_URL', 'SESSION_SECRET');
  }

  required.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(`[Config Error] ${message}`);
    throw new Error(message);
  }

  console.log('[Config] All required environment variables are set');
}

/**
 * Load configuration for current environment
 */
export function loadConfig(): AppConfig {
  const env = getEnvironment();
  const isDevelopment = env === 'development';
  const isStaging = env === 'staging';
  const isProduction = env === 'production';

  // Validate environment variables before proceeding
  validateEnvironmentVariables(env);
  
  // In development, warn about missing required variables
  if (isDevelopment) {
    if (!process.env.DATABASE_URL) {
      console.warn('[Config] DATABASE_URL not set - database features will not work');
    }
    if (!process.env.REPLIT_DOMAINS && !process.env.PRODUCTION_URL) {
      console.warn('[Config] Neither REPLIT_DOMAINS nor PRODUCTION_URL set - authentication may not work correctly');
    }
    if (!process.env.SESSION_SECRET) {
      console.warn('[Config] SESSION_SECRET not set - using default (insecure for production)');
    }
  } else {
    // In staging/production, require critical variables
    // Note: Either REPLIT_DOMAINS or PRODUCTION_URL can be used for authentication
    const requiredVars = ['DATABASE_URL', 'SESSION_SECRET'];
    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for ${env}: ${missing.join(', ')}`);
    }
    
    // Warn if neither auth domain is configured
    if (!process.env.REPLIT_DOMAINS && !process.env.PRODUCTION_URL) {
      console.warn('[Config] Neither REPLIT_DOMAINS nor PRODUCTION_URL set - Google OAuth may not work');
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
      // REPLIT_DOMAINS is now optional - if not set, app uses PRODUCTION_URL for Google OAuth
      replitDomains: process.env.REPLIT_DOMAINS || '',
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
    
    regional: {
      defaultCountry: process.env.DEFAULT_COUNTRY || 'HK',
      defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || '+852',
      defaultLanguage: process.env.DEFAULT_LANGUAGE || 'zh-HK',
    },
  };
  
  // Log configuration on startup (excluding sensitive data)
  console.log(`[Config] Environment: ${env}`);
  console.log(`[Config] Port: ${config.port}`);
  console.log(`[Config] Rate limiting: ${config.rateLimit.enabled ? 'enabled' : 'disabled'}`);
  console.log(`[Config] Session secure cookies: ${config.session.secure}`);
  console.log(`[Config] Sentry monitoring: ${config.monitoring.sentryDsn ? 'enabled' : 'disabled'}`);
  console.log(`[Config] Regional defaults: ${config.regional.defaultCountry} (${config.regional.defaultCountryCode}), Language: ${config.regional.defaultLanguage}`);
  
  return config;
}

// Export singleton config instance
export const config = loadConfig();
