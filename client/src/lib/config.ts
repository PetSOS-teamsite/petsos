/**
 * Frontend environment-specific configuration
 * 
 * Uses Vite's import.meta.env for environment variables
 * All client-side variables must be prefixed with VITE_
 */

export type Environment = 'development' | 'staging' | 'production';

export interface FrontendConfig {
  env: Environment;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  
  // Analytics
  analytics: {
    enabled: boolean;
    measurementId?: string;
  };
  
  // Error Tracking
  monitoring: {
    sentryDsn?: string;
    sentryTracesSampleRate: number;
    sentryReplaysSampleRate: number;
    sentryEnv: string;
  };
  
  // API
  api: {
    baseUrl: string;
  };
}

/**
 * Get current environment from Vite's MODE
 */
export function getEnvironment(): Environment {
  const mode = import.meta.env.MODE?.toLowerCase() || 'development';
  
  if (mode === 'production' || mode === 'prod') return 'production';
  if (mode === 'staging' || mode === 'stage') return 'staging';
  return 'development';
}

/**
 * Load frontend configuration
 */
export function loadConfig(): FrontendConfig {
  const env = getEnvironment();
  const isDevelopment = env === 'development';
  const isStaging = env === 'staging';
  const isProduction = env === 'production';
  
  const config: FrontendConfig = {
    env,
    isDevelopment,
    isStaging,
    isProduction,
    
    analytics: {
      enabled: !isDevelopment, // Disable analytics in development by default
      measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
    },
    
    monitoring: {
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
      sentryTracesSampleRate: isProduction ? 0.1 : 1.0,
      sentryReplaysSampleRate: isProduction ? 0.1 : 1.0,
      sentryEnv: env,
    },
    
    api: {
      baseUrl: isDevelopment ? '' : window.location.origin, // Same origin in prod/staging
    },
  };
  
  // Log configuration on startup (excluding sensitive data)
  console.log(`[Config] Frontend Environment: ${env}`);
  console.log(`[Config] Analytics: ${config.analytics.enabled && config.analytics.measurementId ? 'enabled' : 'disabled'}`);
  console.log(`[Config] Sentry: ${config.monitoring.sentryDsn ? 'enabled' : 'disabled'}`);
  
  return config;
}

// Export singleton config instance
export const config = loadConfig();
