import React, { useState, useEffect, useRef } from 'react';
import '../styles/report.css';

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

import RequireWallet from './RequireWallet';

const About = () => {
  return (
    <RequireWallet>
      {({ address, network }) => (
        <div className="report-container">
          <aside className="sidebar">
            <div className="logo" onClick={() => window.location.href = '/'}>
              <div className="logo-icon">🛡️</div>
              <span>Open Directive</span>
            </div>
            <nav>
              <a 
                href="#reports" 
                className="nav-button"
                onClick={(e) => { e.preventDefault(); window.location.href = '/report'; }}
              >
                <span>📊</span>
                <span>View My Reports</span>
              </a>
              <a 
                href="#validator" 
                className="nav-button"
                onClick={(e) => { e.preventDefault(); window.location.href = '/validator'; }}
              >
                <span>✅</span>
                <span>Become a Validator</span>
              </a>
              <a 
                href="#about" 
                className="nav-button active"
                onClick={(e) => { e.preventDefault(); }}
              >
                <span>ℹ️</span>
                <span>About</span>
              </a>
              <a 
                href="#subscribe" 
                className="nav-button"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/walletinteraction?action=subscribe';
                }}
              >
                <span>💳</span>
                <span>Subscribe</span>
              </a>
            </nav>
            <div className="wallet-section" style={{marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #333'}}>
              <div className="wallet-info" style={{fontSize: 13, color: '#ffd600'}}>
                <div>Address: <span style={{color:'#fff'}}>{address}</span></div>
                {network && <div>Network: <span style={{color:'#fff'}}>{network}</span></div>}
              </div>
            </div>
          </aside>

          <main className="main-content">
            <div className="header">
              <h1>About Open Directive</h1>
              <p>Our mission and technology</p>
              <div className="report-card">
                <div className="summary-section">
                  <h3 className="summary-title">Our Mission</h3>
                  <p className="summary-text">
                    Open Directive is dedicated to making Web3 safer through comprehensive smart contract analysis. 
                    Our AI-powered tools help users identify vulnerabilities before they become critical issues, 
                    protecting both users and projects in the decentralized ecosystem.
                  </p>
                </div>
                <div className="summary-section">
                  <h3 className="summary-title">Technology</h3>
                  <p className="summary-text">
                    We use advanced static analysis, dynamic testing, and machine learning to identify 
                    common vulnerabilities including reentrancy attacks, access control issues, and 
                    logical flaws in smart contracts.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </RequireWallet>
  );
};

export default About;
