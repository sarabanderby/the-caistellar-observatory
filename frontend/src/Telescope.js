import React, { useState, useEffect } from 'react';
import './Telescope.css';

function Telescope() {
  const [view, setView] = useState('activate'); // 'activate', 'hemisphere', 'telescope'
  const [selectedHemisphere, setSelectedHemisphere] = useState(null);
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
    setView('hemisphere');
  };

  const handleHemisphereSelect = (hemisphere) => {
    setSelectedHemisphere(hemisphere);
    setView('telescope');

    // Wait for view to render, then initialize Aladin
    setTimeout(() => {
      initAladin(hemisphere);
    }, 100);
  };

  const initAladin = (hemisphere) => {
    // Set coordinates based on hemisphere
    let raHours, dec;
    if (hemisphere === 'northern') {
      raHours = 12;
      dec = 45;
    } else if (hemisphere === 'southern') {
      raHours = 12;
      dec = -45;
    } else { // equatorial
      raHours = 12;
      dec = 0;
    }

    // Initialize Aladin Lite
    if (window.A) {
      const aladinInstance = window.A.aladin('#aladin-lite-div', {
        survey: 'P/DSS2/color',
        fov: 60,
        target: `${raHours} ${dec}`,
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
        showCooGrid: false,
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

          {view === 'hemisphere' && (
            <div className="hemisphere-choice active">
              <h2 className="choice-title">Select Your Hemisphere</h2>
              <p className="choice-subtitle">Choose your viewing location to begin observation</p>
              <div className="hemisphere-choice-btns">
                <button
                  className="hemisphere-choice-btn"
                  onClick={() => handleHemisphereSelect('northern')}
                >
                  Northern Hemisphere
                </button>
                <button
                  className="hemisphere-choice-btn"
                  onClick={() => handleHemisphereSelect('southern')}
                >
                  Southern Hemisphere
                </button>
                <button
                  className="hemisphere-choice-btn"
                  onClick={() => handleHemisphereSelect('equatorial')}
                >
                  Equatorial View
                </button>
              </div>
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
