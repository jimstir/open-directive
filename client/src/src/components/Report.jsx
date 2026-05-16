import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const Report = () => {
  const [activeNav, setActiveNav] = useState('reports');
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('reports');

  // Only keep report logic; navigation handled by router

  const handleGenerateReport = () => {
    // Find dApp and report address from the report card details
    let dApp = '';
    let reportAddr = '';
    try {
      const details = document.querySelectorAll('.detail-label');
      details.forEach(label => {
        if (label.textContent.trim() === 'dApp Address') {
          dApp = label.nextElementSibling?.textContent?.trim() || '';
        }
        if (label.textContent.trim() === 'Report Address') {
          reportAddr = label.nextElementSibling?.textContent?.trim() || '';
        }
      });
    } catch (e) {}
    // Open wallet interaction page with generatereport action
    const url = `/walletinteraction?action=generatereport&dapp=${encodeURIComponent(dApp)}&report=${encodeURIComponent(reportAddr)}`;
    window.open(url, '_blank');
  };

  const loadLatestReport = () => {
    setLoading(true);
    
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
    
    setTimeout(() => {
      setReportData(report);
      setLoading(false);
    }, 1000);
  };

  const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  const renderReportCard = () => {
    if (loading) {
      return (
        <div className="report-card" id="reportCardLoading">
          <div className="empty-state">
            <h3>Loading report...</h3>
            <p>Please wait while we fetch your latest report.</p>
          </div>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="report-card">
          <div className="empty-state">
            <h3>No report available</h3>
            <p>Could not fetch report data.</p>
          </div>
        </div>
      );
    }

    // Build header without status
    let content = [];
    
    content.push(
      <div className="report-header" key="header">
        <h2 className="report-title">Latest Analysis</h2>
      </div>
    );

    content.push(
      <div className="report-details" key="details">
        <div className="detail-item">
          <div className="detail-label">dApp Address</div>
          <div className="detail-value">{reportData.website || '—'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Report Address</div>
          <div className="detail-value">{reportData.cid || '—'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Submitted By</div>
          <div className="detail-value">{reportData.submitter || '—'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Analysis Date</div>
          <div className="detail-value">{reportData.timestamp || '—'}</div>
        </div>
      </div>
    );

    // Render Simple Summary section
    const simple = reportData.report && reportData.report['Simple Summary'] ? reportData.report['Simple Summary'] : null;
    if (simple) {
      const summaryItems = Object.entries(simple).map(([key, value]) => (
        <div className="detail-item" key={`summary-${key}`}>
          <div className="detail-label">{toTitleCase(key.replace(/_/g, ' '))}</div>
          <div className="detail-value">{value || '—'}</div>
        </div>
      ));
      
      content.push(
        <div className="summary-section" key="summary">
          <h3 className="summary-title">Simple Summary</h3>
          {summaryItems}
        </div>
      );
    }

    // Render vulnerabilities
    if (reportData.report) {
      const vulnKeys = Object.keys(reportData.report).filter(k => k !== 'Simple Summary');
      if (vulnKeys.length > 0) {
        const vulnBlocks = vulnKeys.map(k => {
          const v = reportData.report[k];
          const vulnFields = Object.entries(v)
            .filter(([field]) => field !== 'title')
            .map(([field, val]) => (
              <div className="detail-item" key={`vuln-${k}-${field}`}>
                <div className="detail-label">{toTitleCase(field.replace(/_/g, ' '))}</div>
                <div className="detail-value">{val || '—'}</div>
              </div>
            ));
          
          return (
            <div className="vuln-block" key={`vuln-${k}`}>
              <h4>{v.title || k}</h4>
              {vulnFields}
            </div>
          );
        });
        
        content.push(
          <div className="summary-section" key="vulnerabilities">
            <h3 className="summary-title">Vulnerabilities</h3>
            {vulnBlocks}
          </div>
        );
      }
    }

    return <div className="report-card">{content}</div>;
  };

  // Only render the report content

  return (
    <RequireWallet>
      {({ address, network }) => (
        <div className="report-container">
          <aside className="sidebar">
            <div className="logo">
              <Link to="/home" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="logo-icon">🛡️</div>
                <span>Open Directive</span>
              </Link>
            </div>
            <nav>
              <Link to="/report" className={`nav-button ${activeNav === 'reports' ? 'active' : ''}`}><span>📊</span><span>View My Reports</span></Link>
              <Link to="/validator" className="nav-button"><span>✅</span><span>Become a Validator</span></Link>
              <Link to="/about" className="nav-button"><span>ℹ️</span><span>About</span></Link>
              <Link to="/subscribe" className="nav-button"><span>💳</span><span>Subscribe</span></Link>
            </nav>
            <div className="wallet-section" style={{marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #333'}}>
              <div className="wallet-info" style={{fontSize: 13, color: '#ffd600'}}>
                <div>Address: <span style={{color:'#fff'}}>{address}</span></div>
                {network && <div>Network: <span style={{color:'#fff'}}>{network}</span></div>}
              </div>
            </div>
          </aside>

          <main className="main-content">
            <div className="header" style={{display:'flex', alignItems:'center', gap:'24px'}}>
              <h1 style={{marginRight:'16px'}}>Analyst Agent Report</h1>
              <button className="new-report-btn" onClick={handleGenerateReport} style={{marginLeft:'auto'}}>📋 Generate Report</button>
            </div>
            {renderReportCard()}
          </main>
        </div>
      )}
    </RequireWallet>
  );
};

export default Report;
