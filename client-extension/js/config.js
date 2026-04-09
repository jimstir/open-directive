// Environment configuration for Open Directive extension
// This file uses env.js for environment variables

// Import environment variables from env.js
let env = {};
try {
  env = require('./env.js');
} catch (e) {
  console.log('env.js not found, using defaults');
}

// Export configuration
window.OD_CONFIG = {
  // Use CONNECT_ENDPOINT from env.js as the primary URL for connecting.html (now React app)
  CONNECTING_PAGE_URL: env.CONNECT_ENDPOINT || 'http://localhost:5173',
  
  // Use CONNECT_BASE_URL from env.js for other HTTP connections
  CONNECT_BASE_URL: env.CONNECT_BASE_URL || 'http://localhost:8080',
  
  // Other environment-specific settings from env.js
  API_BASE_URL: env.API_BASE_URL || 'http://localhost:8080/api',
  ENVIRONMENT: env.NODE_ENV || 'development',
  
  // Import other env variables if available
  GUARD_ENDPOINT: env.GUARD_ENDPOINT || '',
  REPORT_ENDPOINT: env.REPORT_ENDPOINT || '',
  SUBSCRIPTION_ADDRESS: env.SUBSCRIPTION_ADDRESS || '',
  
  // Contract addresses from env.js
  OPEN_DIRECTIVE_ADDRESS: env.OPEN_DIRECTIVE_ADDRESS || '',
  SITE_RECORD_ADDRESS: env.SITE_RECORD_ADDRESS || '',
  VERIFIER_REWARDS_ADDRESS: env.VERIFIER_REWARDS_ADDRESS || '',
  DIRECTIVE_TOKEN_ADDRESS: env.DIRECTIVE_TOKEN_ADDRESS || ''
};

console.log('Open Directive Config:', window.OD_CONFIG);
