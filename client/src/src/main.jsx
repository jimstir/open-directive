import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Home from './components/Home.jsx';
import Report from './components/Report.jsx';
import About from './components/About.jsx';
import Validator from './components/Validator.jsx';
import WalletInteraction from './components/WalletInteraction.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/about" element={<About />} />
        <Route path="/validator" element={<Validator />} />
        <Route path="/walletinteraction" element={<WalletInteraction />} />
        <Route path="/subscribe" element={<Navigate to="/walletinteraction?action=subscribe" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
