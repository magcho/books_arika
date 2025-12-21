/**
 * Environment configuration management
 * Centralizes environment variable access and validation
 */

export interface Config {
  googleBooksApiKey: string | undefined
  defaultUserId: string
  nodeEnv: 'development' | 'production' | 'test'
}

/**
 * Get configuration from environment
 * In Cloudflare Workers, environment variables are passed via Env binding
 */
export function getConfig(env: { GOOGLE_BOOKS_API_KEY?: string; DEFAULT_USER_ID?: string }): Config {
  return {
    googleBooksApiKey: env.GOOGLE_BOOKS_API_KEY,
    defaultUserId: env.DEFAULT_USER_ID || 'default-user', // Can be overridden via environment variable
    nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
  }
}

/**
 * Validate that required configuration is present
 */
export function validateConfig(config: Config): void {
  // Google Books API key is optional (manual entry fallback available)
  // Add other required config validation here
}

