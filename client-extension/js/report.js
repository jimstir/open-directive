// Modern report page functionality

// Load configuration
let CONFIG = {};
try {
  // This will be loaded from config.js
  CONFIG = window.OD_CONFIG || {
    CONNECTING_PAGE_URL: 'http://localhost:8080/connecting.html',
    CONNECT_BASE_URL: 'http://localhost:8080'
  };
} catch (e) {
  console.log('Config not loaded, using defaults');
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Report page loaded');
  console.log('Using config:', CONFIG);
  
  // Navigation functionality
  const homeBtn = document.getElementById('homeBtn');
  const reportsBtn = document.getElementById('reportsBtn');
  const validatorBtn = document.getElementById('validatorBtn');
  const aboutBtn = document.getElementById('aboutBtn');
  const generateReportBtn = document.getElementById('generateReportBtn');
  
  // Remove active class from all nav buttons
  function setActiveNav(activeBtn) {
    document.querySelectorAll('.nav-button').forEach(btn => {
      btn.classList.remove('active');
    });
    activeBtn?.classList.add('active');
  }
  
  // Navigation handlers
  // Removed sidebar navigation event listeners to allow default browser navigation
  
  // Generate report functionality
  generateReportBtn?.addEventListener('click', () => {
    // Find dApp and report address from the report card details
    let dApp = '';
    let reportAddr = '';
    document.querySelectorAll('.detail-label').forEach(label => {
      if (label.textContent.trim() === 'dApp Address') {
        dApp = label.nextElementSibling?.textContent?.trim() || '';
      }
      if (label.textContent.trim() === 'Report Address') {
        reportAddr = label.nextElementSibling?.textContent?.trim() || '';
      }
    });
    openOrSwitchWalletInteractionTab(dApp, reportAddr);
  });
  // Open or switch to wallet interaction tab with params
  function openOrSwitchWalletInteractionTab(dApp, reportAddr) {
    const url = `${CONFIG.CONNECTING_PAGE_URL}?dapp=${encodeURIComponent(dApp)}&report=${encodeURIComponent(reportAddr)}`;
    // Try to find an existing tab (if running in extension context)
    if (window.chrome && chrome.tabs) {
      chrome.tabs.query({ url: CONFIG.CONNECTING_PAGE_URL + '*' }, function(tabs) {
        if (tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { active: true, url });
        } else {
          window.open(url, '_blank');
        }
      });
    } else {
      // Fallback: just open new tab
      window.open(url, '_blank');
    }
  }
  
  // Wallet connect functionality via external connecting.html
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
  let connectWindow = null;

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.type !== 'WALLET_CONNECTED' || !data.address) return;

    const address = data.address;

    if (connectWalletBtn) {
      connectWalletBtn.classList.add('connected');
      connectWalletBtn.textContent = 'Wallet Connected';
    }
    if (walletInfo) {
      walletInfo.innerHTML = `<div>Address: ${address}</div>`;
    }

    if (connectWindow && !connectWindow.closed) {
      connectWindow.close();
    }
  });

  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', async () => {
      console.log('Opening wallet connection URL:', CONFIG.CONNECTING_PAGE_URL);
      connectWindow = window.open(
        CONFIG.CONNECTING_PAGE_URL,
        'walletConnectPopup',
        'width=480,height=640'
      );
      if (walletInfo) {
        walletInfo.textContent = 'Opening wallet connection window...';
      }
    });
  }
  
  // Load initial data
  loadLatestReport();
});

function loadHomePage() {
  const mainContent = document.querySelector('.main-content');
  mainContent.innerHTML = `
    <div class="header">
      <h1>Open Directive</h1>
      <p>Your trusted Web3 security companion</p>
    </div>
    <div class="report-card">
      <div class="report-header">
        <h2 class="report-title">Welcome</h2>
        <span class="report-status">Active</span>
      </div>
      <div class="summary-section">
        <h3 class="summary-title">Get Started</h3>
        <p class="summary-text">
          Navigate through the sidebar to view your security reports, become a validator, or learn more about our mission to secure the decentralized web.
        </p>
      </div>
    </div>
  `;
}

function loadReportsPage() {
  const mainContent = document.querySelector('.main-content');
  mainContent.innerHTML = `
    <div class="header">
      <h1>My Reports</h1>
      <p>History of your security analyses</p>
    </div>
    <div class="report-card" id="reportCardLoading">
      <div class="empty-state">
        <h3>Loading report...</h3>
        <p>Please wait while we fetch your latest report.</p>
      </div>
    </div>
  `;

  // Simulate waiting for payload from agent/server (replace with real fetch or messaging logic)
  // Example payload: { hash: '0x...', url: 'https://server/reports/0x...', submitter: '0x...', time: 1234567890 }
  setTimeout(async () => {
    // Simulated payload (replace with real agent/server response)
    const payload = {
      hash: '0xmockhash',
      url: 'https://example.com/api/report/0xmockhash',
      submitter: '0xAgentAddress',
      time: 1763251200 // Example timestamp
    };

    // Fetch report data from resolved URL (simulate for now)
    let reportData;
    try {
      // Uncomment and use real fetch in production:
      // const resp = await fetch(payload.url);
      // reportData = await resp.json();
      // Simulated report data matching agent/tools/schema.json structure
      const reportData = {
        website: 'example-dapp.com',
        cid: payload.hash,
        submitter: payload.submitter,
        timestamp: new Date(payload.time * 1000).toUTCString(),
        report: {
          "Simple Summary": {
            risk_level: 'Low',
            user_impact: 'Minimal',
            who_is_affected: 'All users',
            likelihood: 'Low',
            funds_at_risk: 'Low',
            exploit_status: 'Not exploited',
            user_action: 'Monitor updates'
          },
          "vulnerability_1": {
            title: 'Example vulnerability',
            severity: 'Informational',
            contract: 'ExampleContract',
            function: 'example()',
            description: 'No critical issue — sample vulnerability for demo.',
            impact: 'Low',
            exploit_scenario: 'Theoretical only',
            recommendation: 'No action required',
            confidence: 'High',
            provider: 'Automated Scanner'
          }
        }
      };
    } catch (e) {
      reportData = null;
    }

    const reportCard = document.getElementById('reportCardLoading');
    if (reportData && reportCard) {
      updateReportCard(reportCard, reportData);
    } else if (reportCard) {
      reportCard.innerHTML = `<div class="empty-state"><h3>Failed to load report</h3><p>Could not fetch report data.</p></div>`;
    }
  }, 1000); // Simulate 1s async wait
}

function loadValidatorPage() {
  const mainContent = document.querySelector('.main-content');
  mainContent.innerHTML = `
    <div class="header">
      <h1>Become a Validator</h1>
      <p>Join our network of security experts</p>
    </div>
    <div class="report-card">
      <div class="summary-section">
        <h3 class="summary-title">Validator Program</h3>
        <p class="summary-text">
          As a validator, you'll help secure the Web3 ecosystem by reviewing smart contracts and contributing to our decentralized security network. Earn rewards while making DeFi safer for everyone.
        </p>
        <button class="new-report-btn">Apply to Become Validator</button>
      </div>
    </div>
  `;
}

function loadAboutPage() {
  const mainContent = document.querySelector('.main-content');
  mainContent.innerHTML = `
    <div class="header">
      <h1>About Open Directive</h1>
      <p>Our mission and technology</p>
    </div>
    <div class="report-card">
      <div class="summary-section">
        <h3 class="summary-title">Our Mission</h3>
        <p class="summary-text">
          Open Directive is dedicated to making Web3 safer through comprehensive smart contract analysis. 
          Our AI-powered tools help users identify vulnerabilities before they become critical issues, 
          protecting both users and projects in the decentralized ecosystem.
        </p>
      </div>
      <div class="summary-section">
        <h3 class="summary-title">Technology</h3>
        <p class="summary-text">
          We use advanced static analysis, dynamic testing, and machine learning to identify 
          common vulnerabilities including reentrancy attacks, access control issues, and 
          logical flaws in smart contracts.
        </p>
      </div>
    </div>
  `;
}

function loadLatestReport() {
  // Mock data for now - replace with actual API call
  const report = {
    website: 'example-dapp.com',
    cid: 'QmMockCID1234567890',
    submitter: '0xAgentAddress',
    timestamp: '2026-03-06 12:34 UTC',
    report: {
      "Simple Summary": {
        risk_level: 'Low',
        user_impact: 'Minimal',
        who_is_affected: 'All users',
        likelihood: 'Low',
        funds_at_risk: 'Low',
        exploit_status: 'Not exploited',
        user_action: 'Monitor updates'
      },
      "vulnerability_1": {
        title: 'Example vulnerability',
        severity: 'Informational',
        contract: 'ExampleContract',
        function: 'example()',
        description: 'No critical issue — sample vulnerability for demo.',
        impact: 'Low',
        exploit_scenario: 'Theoretical only',
        recommendation: 'No action required',
        confidence: 'High',
        provider: 'Automated Scanner'
      }
    }
  };
  
  // Update the existing report card if it exists
  const reportCard = document.querySelector('.report-card');
  if (reportCard) {
    updateReportCard(reportCard, report);
  }
}

function updateReportCard(card, report) {
  // Build header without status
  let html = `
    <div class="report-header">
      <h2 class="report-title">Latest Analysis</h2>
    </div>

    <div class="report-details">
      <div class="detail-item">
        <div class="detail-label">dApp Address</div>
        <div class="detail-value">${report.website || '—'}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Report Address</div>
        <div class="detail-value">${report.cid || '—'}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Submitted By</div>
        <div class="detail-value">${report.submitter || '—'}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Analysis Date</div>
        <div class="detail-value">${report.timestamp || '—'}</div>
      </div>
    </div>
  `;

  // Render Simple Summary section (schema: report["Simple Summary"])
  const simple = report.report && report.report['Simple Summary'] ? report.report['Simple Summary'] : null;
  if (simple) {
    html += `<div class="summary-section"><h3 class="summary-title">Simple Summary</h3>`;
    for (const [key, value] of Object.entries(simple)) {
      html += `
        <div class="detail-item">
          <div class="detail-label">${toTitleCase(key.replace(/_/g, ' '))}</div>
          <div class="detail-value">${value || '—'}</div>
        </div>
      `;
    }
    html += `</div>`;
  }

  // Render vulnerabilities (all other keys under report)
  if (report.report) {
    const vulnKeys = Object.keys(report.report).filter(k => k !== 'Simple Summary');
    if (vulnKeys.length > 0) {
      html += `<div class="summary-section"><h3 class="summary-title">Vulnerabilities</h3>`;
      vulnKeys.forEach(k => {
        const v = report.report[k];
        html += `<div class="vuln-block"><h4>${v.title || k}</h4>`;
        for (const [field, val] of Object.entries(v)) {
          if (field === 'title') continue;
          html += `
            <div class="detail-item">
              <div class="detail-label">${toTitleCase(field.replace(/_/g, ' '))}</div>
              <div class="detail-value">${val || '—'}</div>
            </div>
          `;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }
  }

  card.innerHTML = html;
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function generateNewReport() {
  console.log('Opening new report generation...');
  alert('New report generation would be implemented here. This would analyze the current dApp.');
}
