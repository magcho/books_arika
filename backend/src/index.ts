/**
 * Cloudflare Workers entry point
 * Exports the Hono application for Cloudflare Workers
 */

import app from './api'

export default {
  fetch: app.fetch,
}

