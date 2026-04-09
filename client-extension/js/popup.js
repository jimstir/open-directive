console.log('Working script loaded');

// Load configuration
let CONFIG = {};
try {
  // This will be loaded from config.js
  CONFIG = window.OD_CONFIG || {
    CONNECT_BASE_URL: 'http://localhost:8080',
    CONNECTING_PAGE_URL: 'http://localhost:8080/connecting.html',
    API_BASE_URL: 'http://localhost:8080/api',
    ENVIRONMENT: 'development'
  };
} catch (e) {
  console.log('Config not loaded, using defaults');
}

document.addEventListener('DOMContentLoaded', function() {
  const guardBtn = document.getElementById('guardBtn');
  const viewReportBtn = document.getElementById('viewReportBtn');

  // Guard button: open wallet interaction page
  if (guardBtn) {
    guardBtn.addEventListener('click', () => {
      const walletInteractionUrl = 'http://localhost:5174/report';
      window.open(walletInteractionUrl, '_blank');
    });
  }

  // View Latest Report button: open wallet interaction page
  if (viewReportBtn) {
    viewReportBtn.addEventListener('click', () => {
      const walletInteractionUrl = 'http://localhost:5174/walletinteraction';
      window.open(walletInteractionUrl, '_blank');
    });
  }
});
