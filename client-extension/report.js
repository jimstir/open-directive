// Modern report page functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('Report page loaded');
  
  // Navigation functionality
  const homeBtn = document.getElementById('homeBtn');
  const reportsBtn = document.getElementById('reportsBtn');
  const validatorBtn = document.getElementById('validatorBtn');
  const aboutBtn = document.getElementById('aboutBtn');
  const newReportBtn = document.getElementById('newReportBtn');
  
  // Remove active class from all nav buttons
  function setActiveNav(activeBtn) {
    document.querySelectorAll('.nav-button').forEach(btn => {
      btn.classList.remove('active');
    });
    activeBtn?.classList.add('active');
  }
  
  // Navigation handlers
  homeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav(null); // Remove active from nav buttons when home is clicked
    loadHomePage();
  });
  
  reportsBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav(reportsBtn);
    loadReportsPage();
  });
  
  validatorBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav(validatorBtn);
    loadValidatorPage();
  });
  
  aboutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav(aboutBtn);
    loadAboutPage();
  });
  
  // New report functionality
  newReportBtn?.addEventListener('click', () => {
    console.log('Generating new report...');
    generateNewReport();
  });
  
  // Wallet connect functionality via external connecting.html
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const walletInfo = document.getElementById('walletInfo');
  const CONNECTING_PAGE_URL = 'http://localhost:8080/client-extension/connecting.html';
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
    connectWalletBtn.addEventListener('click', () => {
      connectWindow = window.open(
        CONNECTING_PAGE_URL,
        'walletConnectReport',
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
    <div class="report-card">
      <div class="empty-state">
        <h3>No reports yet</h3>
        <p>Start analyzing dApps to see your security reports here.</p>
      </div>
    </div>
  `;
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
    summary: 'No critical vulnerabilities found. The smart contract implementation follows industry best practices with proper access controls and secure coding patterns. Minor recommendations include implementing additional input validation and enhancing the event logging mechanism.',
    status: 'Secure'
  };
  
  // Update the existing report card if it exists
  const reportCard = document.querySelector('.report-card');
  if (reportCard) {
    updateReportCard(reportCard, report);
  }
}

function updateReportCard(card, report) {
  const statusClass = report.status.toLowerCase() === 'secure' ? '' : 
                    report.status.toLowerCase() === 'warning' ? 'warning' : 'error';
  
  card.innerHTML = `
    <div class="report-header">
      <h2 class="report-title">Latest Analysis</h2>
      <span class="report-status ${statusClass}">${report.status}</span>
    </div>

    <div class="report-details">
      <div class="detail-item">
        <div class="detail-label">Website Analyzed</div>
        <div class="detail-value">${report.website}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Report CID</div>
        <div class="detail-value">${report.cid}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Submitted By</div>
        <div class="detail-value">${report.submitter}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Analysis Date</div>
        <div class="detail-value">${report.timestamp}</div>
      </div>
    </div>

    <div class="summary-section">
      <h3 class="summary-title">Security Summary</h3>
      <p class="summary-text">${report.summary}</p>
    </div>

    <button class="new-report-btn" id="newReportBtn">📋 Generate New Report</button>
  `;
  
  // Re-attach event listener to new button
  document.getElementById('newReportBtn')?.addEventListener('click', generateNewReport);
}

function generateNewReport() {
  console.log('Opening new report generation...');
  alert('New report generation would be implemented here. This would analyze the current dApp.');
}
