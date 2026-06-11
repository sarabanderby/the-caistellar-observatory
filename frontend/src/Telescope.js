import React, { useState, useEffect } from 'react';
import './Telescope.css';

function Telescope() {
  const [view, setView] = useState('activate'); // 'activate', 'telescope'
  const [aladin, setAladin] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

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
            <button className="icon-btn" onClick={() => setShowHelp(true)} title="Help">?</button>
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

      {/* Help Modal */}
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>How to Use the Digital Telescope</h2>

            <p style={{ marginTop: '20px', marginBottom: '15px' }}>
              <strong>NAVIGATION</strong>
            </p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Click and drag to pan across the sky</p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Use mouse wheel or pinch to zoom in/out</p>
            <p style={{ marginLeft: '20px', marginBottom: '20px' }}>▸ Click on stars and celestial objects for information</p>

            <p style={{ marginBottom: '15px' }}>
              <strong>CONTROLS</strong>
            </p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Use the zoom controls (+/-) on the right side</p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Toggle layers to view different sky surveys</p>
            <p style={{ marginLeft: '20px', marginBottom: '20px' }}>▸ Click fullscreen icon to expand view</p>

            <p style={{ marginBottom: '15px' }}>
              <strong>COORDINATE GRID</strong>
            </p>
            <p style={{ marginLeft: '20px', marginBottom: '20px' }}>▸ Purple grid lines show Right Ascension (vertical) and Declination (horizontal)</p>

            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
              Powered by <a href="https://aladin.cds.unistra.fr/AladinLite/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'underline' }}>Aladin Lite</a> (GPL 3.0)<br />
              Developed by CDS, Strasbourg Astronomical Data Center
            </p>

            <button onClick={() => setShowHelp(false)} style={{ marginTop: '25px' }}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Telescope;
