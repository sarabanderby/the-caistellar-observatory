import React, { useState, useEffect } from 'react';
import './Telescope.css';

function Telescope() {
  const [view, setView] = useState('activate'); // 'activate', 'telescope'
  const [aladin, setAladin] = useState(null);

  useEffect(() => {
    // Load Aladin Lite script
    const script = document.createElement('script');
    script.src = '/aladin/aladin.js';
    script.async = true;
    document.body.appendChild(script);

    // Load Aladin Lite CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/aladin/aladin.css';
    document.head.appendChild(link);

    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  const handleActivate = () => {
    setView('telescope');

    // Wait for view to render, then initialize Aladin
    setTimeout(() => {
      initAladin();
    }, 100);
  };

  const initAladin = () => {
    // Initialize Aladin Lite pointing to equatorial view
    if (window.A) {
      const aladinInstance = window.A.aladin('#aladin-lite-div', {
        survey: 'P/DSS2/color',
        fov: 60,
        target: '12 0', // Equatorial view
        projection: 'AIT',
        cooFrame: 'equatorial',
        showReticle: false,
        showZoomControl: true,
        showFullscreenControl: true,
        showLayersControl: true,
        showGotoControl: false,
        showShareControl: false,
        showCatalog: true,
        showFrame: false,
        showCooGrid: true, // Re-enable grid
        fullScreen: false
      });

      setAladin(aladinInstance);
    }
  };

  const handleBackToEnhancement = () => {
    window.location.href = '/';
  };

  return (
    <div className="telescope-page">
      <div className={`app-container ${view === 'telescope' ? 'telescope-active' : ''}`}>
        {/* Top bar */}
        <div className="top-bar">
          <div className="logo">
            <div className="logo-icon">⊙</div>
          </div>
          <div className="top-controls">
            <button className="icon-btn" title="Help">?</button>
          </div>
        </div>

        {/* Telescope Header (shown when active) */}
        {view === 'telescope' && (
          <div className="telescope-header active">
            <h1 className="main-title">Digital Telescope</h1>
            <p className="subtitle">Interactive Sky Observatory</p>
          </div>
        )}

        {/* Left sidebar */}
        <div className="left-sidebar"></div>

        {/* Center content */}
        <div className="center-content">
          {view === 'activate' && (
            <div className="activate-telescope">
              <h2 className="activate-title">CAIstellic Telescope</h2>
              <p className="activate-subtitle">Digital Sky Observatory</p>
              <button className="activate-btn" onClick={handleActivate}>
                ACTIVATE
              </button>
            </div>
          )}

          {view === 'telescope' && (
            <div className="telescope-container active">
              <div id="aladin-lite-div"></div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="right-sidebar"></div>

        {/* Bottom bar */}
        <div className="bottom-bar">
          <button className="nav-link-btn" onClick={handleBackToEnhancement}>
            ← BACK TO ENHANCEMENT
          </button>
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>TELESCOPE ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Telescope;
