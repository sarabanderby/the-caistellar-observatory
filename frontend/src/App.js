import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import './App.css';
import './Telescope.css';

function App() {
  const [image, setImage] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [systemOnline, setSystemOnline] = useState(false);
  const [boxPosition, setBoxPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [telescopeView, setTelescopeView] = useState('activate');
  const [showTelescopeHelp, setShowTelescopeHelp] = useState(false);
  const [aladin, setAladin] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const imageContainerRef = useRef(null);
  const telescopeSectionRef = useRef(null);

  // API endpoint - use backend route
  const BACKEND_BASE = window.location.hostname.includes('localhost')
    ? 'http://localhost:8080'
    : `${window.location.protocol}//${window.location.hostname.replace('caistellar', 'caistellar-backend')}`;
  const API_ENDPOINT = `${BACKEND_BASE}/api/enhance`;

  // Check system health on mount and every 30 seconds
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get(`${BACKEND_BASE}/health`, { timeout: 5000 });
        setSystemOnline(true);
      } catch (err) {
        setSystemOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [BACKEND_BASE]);

  // Load Aladin Lite on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/aladin/aladin.js';
    script.async = true;
    document.body.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/aladin/aladin.css';
    document.head.appendChild(link);

    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  const scrollToTelescope = () => {
    telescopeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleActivateTelescope = () => {
    setTelescopeView('telescope');
    setTimeout(() => {
      initAladin();
    }, 100);
  };

  const handleCaptureAndEnhance = async () => {
    const aladinDiv = document.getElementById('aladin-lite-div');
    if (!aladinDiv) {
      setError('Telescope view not found');
      return;
    }

    try {
      setProcessing(true);

      // Capture the Aladin div as a canvas using html2canvas
      const canvas = await html2canvas(aladinDiv, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#000000',
        logging: false
      });

      // Convert canvas to base64 PNG
      const dataURL = canvas.toDataURL('image/png');

      // Load captured image into enhancement section
      setImage(dataURL);
      setEnhancedImage(null);
      setError(null);
      setBoxPosition({ x: 50, y: 50 });
      setProcessing(false);

      // Scroll to top to show enhancement section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Screenshot failed:', err);
      setError('Failed to capture telescope view: ' + err.message);
      setProcessing(false);
    }
  };

  const initAladin = () => {
    if (window.A) {
      const aladinInstance = window.A.aladin('#aladin-lite-div', {
        survey: 'P/DSS2/color',
        fov: 60,
        target: '12 0',
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
        showCooGrid: true,
        fullScreen: false
      });
      setAladin(aladinInstance);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setEnhancedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied or not available');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      setImage(imageData);
      setEnhancedImage(null);
      setError(null);
      closeCamera();
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const clearImage = () => {
    setImage(null);
    setEnhancedImage(null);
    setError(null);
    setBoxPosition({ x: 50, y: 50 });
  };

  const redoSelection = () => {
    setEnhancedImage(null);
    setError(null);
    setBoxPosition({ x: 50, y: 50 });
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (imageContainerRef.current) {
      const containerRect = imageContainerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - containerRect.left - boxPosition.x;
      const offsetY = e.clientY - containerRect.top - boxPosition.y;
      setDragStart({ x: offsetX, y: offsetY });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !imageContainerRef.current) return;

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    let newX = e.clientX - containerRect.left - dragStart.x;
    let newY = e.clientY - containerRect.top - dragStart.y;

    // Keep box within container bounds
    newX = Math.max(0, Math.min(newX, containerRect.width - 256));
    newY = Math.max(0, Math.min(newY, containerRect.height - 256));

    setBoxPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const extractCroppedImage = () => {
    return new Promise((resolve) => {
      const img = imageRef.current;
      if (!img) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Box position is now relative to the image container
      // Scale from displayed size to natural size
      const imgRect = img.getBoundingClientRect();
      const scaleX = img.naturalWidth / imgRect.width;
      const scaleY = img.naturalHeight / imgRect.height;

      const sourceX = boxPosition.x * scaleX;
      const sourceY = boxPosition.y * scaleY;
      const sourceWidth = 256 * scaleX;
      const sourceHeight = 256 * scaleY;

      // Draw cropped region
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, 256, 256
      );

      canvas.toBlob(resolve, 'image/png');
    });
  };

  const handleEnhance = async () => {
    if (!image) {
      setError('Please upload an image first');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Extract the 256x256 cropped region
      const croppedBlob = await extractCroppedImage();
      if (!croppedBlob) {
        setError('Failed to extract image region');
        setProcessing(false);
        return;
      }

      console.log('Cropped blob size:', croppedBlob.size, 'type:', croppedBlob.type);

      // Create FormData
      const formData = new FormData();
      formData.append('image', croppedBlob, 'cropped.png');

      console.log('Sending to:', API_ENDPOINT);

      const response = await axios.post(API_ENDPOINT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000,
        responseType: 'blob'
      });

      console.log('Response status:', response.status);

      // Convert blob response to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setEnhancedImage(reader.result);
      };
      reader.readAsDataURL(response.data);

    } catch (err) {
      console.error('Enhancement error:', err);
      console.error('Error response:', err.response?.data);

      // Always ensure error is a string
      let errorMsg = 'Enhancement failed';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.detail && typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else {
          errorMsg = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="App" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="app-container">
        {/* Top bar */}
        <div className="top-bar">
          <div className="logo">
            <div className="logo-icon">⊙</div>
          </div>
          <div className="top-controls">
            <button className="icon-btn" onClick={() => setShowHelp(true)} title="Help">?</button>
          </div>
        </div>

        {/* Left sidebar */}
        <div className="left-sidebar">
          <div>
            <h1 className="main-title">
              Welcome to<br />
              CAIstellar<br />
              Observatory
            </h1>
            <div className="nav-items">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button className="nav-item" onClick={() => fileInputRef.current?.click()}>
                Upload
              </button>
              <button className="nav-item" onClick={handleCameraClick}>
                Camera
              </button>
              <button className="nav-item" onClick={scrollToTelescope}>
                Telescope
              </button>
              <button className="nav-item" onClick={() => setShowAbout(true)}>
                About
              </button>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="center-content">
          {!image && !enhancedImage && (
            <div className="welcome-screen">
              <div className="celestial-object"></div>
              <div className="scroll-indicator" onClick={scrollToTelescope}>∨</div>
            </div>
          )}

          {image && !enhancedImage && (
            <div className="image-viewer">
              <div ref={imageContainerRef} style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  ref={imageRef}
                  src={image}
                  alt="Uploaded"
                  style={{ maxWidth: '1200px', maxHeight: '900px', display: 'block', userSelect: 'none' }}
                />

                <div
                  className="selection-box"
                  style={{
                    position: 'absolute',
                    left: `${boxPosition.x}px`,
                    top: `${boxPosition.y}px`
                  }}
                  onMouseDown={handleMouseDown}
                >
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
                <button className="enhance-btn" onClick={handleEnhance} disabled={processing}>
                  {processing && (
                    <div className="spinner-container">
                      <div className="planet"></div>
                      <div className="moon-orbit">
                        <div className="moon"></div>
                      </div>
                    </div>
                  )}
                  {processing ? 'PROCESSING...' : 'ENHANCE'}
                </button>
                <button className="enhance-btn" onClick={clearImage}>
                  CLEAR IMAGE
                </button>
              </div>
            </div>
          )}

          {enhancedImage && (
            <div className="image-viewer">
              <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', maxWidth: '90%', margin: '0 auto' }}>
                <div className="enhanced-panel" style={{ flex: '0 0 auto' }}>
                  <h3>Enhanced Result</h3>
                  <img src={enhancedImage} alt="Enhanced" />
                </div>

                <div className="ai-disclaimer" style={{ flex: '1', maxWidth: '400px', marginTop: '0' }}>
                  <h4>⚠ AI Enhancement Notice</h4>
                  <p>
                    The AI enhancement process performs image restoration tasks such as super-resolution, denoising, and artifact removal.
                    Its strengths include improving apparent image sharpness, reducing noise, and recovering visually plausible fine structures.
                    However, the model infers details from learned patterns rather than physical measurements, meaning some reconstructed features
                    may not accurately reflect the original data. Performance also degrades as image quality decreases; when images are heavily
                    pixelated, blurred, compressed, or lack sufficient underlying information, the model may produce increasingly uncertain or
                    artificial-looking details. In astronomical imagery, the enhancement process does not preserve or reconstruct physical properties
                    such as luminosity, flux, spectral information, object classifications, or other scientifically measured characteristics, and
                    enhanced features should therefore be interpreted as visual approximations rather than direct representations of the underlying
                    observations.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
                <button className="enhance-btn" onClick={redoSelection}>
                  REDO SELECTION
                </button>
                <button className="enhance-btn" onClick={clearImage}>
                  CLEAR IMAGE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="right-sidebar">
          <div className="info-item">
            <span className="info-label">Mission</span>
            <span className="info-value">Explore</span>
          </div>
          <div className="info-item">
            <span className="info-label">Band</span>
            <span className="info-value">Optical</span>
          </div>
          <div className="info-item">
            <span className="info-label">Resolution</span>
            <span className="info-value">256→512</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status</span>
            <span className="info-value">{processing ? 'Processing' : 'Ready'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Telescope</span>
            <span className="info-value">Operational</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bottom-bar">
          <div className="status-indicator">
            <div className={systemOnline ? "status-dot" : "status-dot offline"}></div>
            <span>{systemOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Help Modal - Instructions */}
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>How to Use</h2>

            <p style={{ marginTop: '20px', marginBottom: '15px' }}>
              <strong>1. LOAD IMAGE</strong>
            </p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Click Upload to select an image file</p>
            <p style={{ marginLeft: '20px', marginBottom: '20px' }}>▸ Click Camera to capture from your device</p>

            <p style={{ marginBottom: '15px' }}>
              <strong>2. SELECT REGION</strong>
            </p>
            <p style={{ marginLeft: '20px', marginBottom: '20px' }}>▸ Drag the cyan selection box over the area you want to enhance</p>

            <p style={{ marginBottom: '15px' }}>
              <strong>3. ENHANCE</strong>
            </p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Click ENHANCE to process the selected region</p>
            <p style={{ marginLeft: '20px', marginBottom: '20px' }}>▸ The 256x256 selection will be enhanced to 512x512 (2x resolution)</p>

            <p style={{ marginBottom: '15px' }}>
              <strong>4. REVIEW RESULTS</strong>
            </p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Click REDO SELECTION to choose a different area</p>
            <p style={{ marginLeft: '20px', marginBottom: '20px' }}>▸ Click CLEAR IMAGE to start over with a new image</p>

            <button onClick={() => setShowHelp(false)} style={{ marginTop: '25px' }}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* About Modal - Mission Briefing */}
      {showAbout && (
        <div className="help-overlay" onClick={() => setShowAbout(false)}>
          <div className="help-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '10px' }}>MISSION BRIEFING</h2>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', opacity: 0.9 }}>CAIstellar Observatory</h3>

            <p style={{ marginBottom: '20px' }}>
              <strong>OBJECTIVE:</strong> Demonstrate AI-powered image enhancement on Red Hat OpenShift AI
            </p>

            <p style={{ marginBottom: '15px' }}>
              <strong>CAPABILITIES:</strong>
            </p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Deep space image super-resolution (256px → 512px)</p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Real-time model inference via MLServer</p>
            <p style={{ marginLeft: '20px', marginBottom: '20px' }}>▸ Enterprise Kubernetes deployment</p>

            <p style={{ marginBottom: '15px' }}>
              <strong>TECHNOLOGY:</strong>
            </p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ SwinIR transformer architecture</p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ ONNX runtime optimization</p>
            <p style={{ marginLeft: '20px', marginBottom: '20px' }}>▸ Red Hat Universal Base Images</p>

            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '25px' }}>
              This Quickstart serves as a reference architecture for deploying production AI workloads on OpenShift.
            </p>

            <button onClick={() => setShowAbout(false)} style={{ marginTop: '25px' }}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="camera-overlay">
          <video ref={videoRef} autoPlay playsInline style={{ maxWidth: '80%', maxHeight: '70vh', border: '2px solid rgba(255, 255, 255, 0.3)' }}></video>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={capturePhoto}>CAPTURE</button>
            <button onClick={closeCamera}>CANCEL</button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 50, 50, 0.9)',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '4px',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}

      {/* Telescope Section */}
      <div ref={telescopeSectionRef} className="page-section telescope-page">
        <div className={`app-container ${telescopeView === 'telescope' ? 'telescope-active' : ''}`}>
          {/* Top bar */}
          <div className="top-bar">
            <div className="logo">
              <div className="logo-icon">⊙</div>
            </div>
            <div className="top-controls">
              <button className="icon-btn" onClick={() => setShowTelescopeHelp(true)} title="Help">?</button>
            </div>
          </div>

          {/* Telescope Header (shown when active) */}
          {telescopeView === 'telescope' && (
            <div className="telescope-header active">
              <h1 className="main-title">Digital Telescope</h1>
              <p className="subtitle">Interactive Sky Observatory</p>
            </div>
          )}

          {/* Left sidebar */}
          <div className="left-sidebar"></div>

          {/* Center content */}
          <div className="center-content">
            {telescopeView === 'activate' && (
              <div className="activate-telescope">
                <h2 className="activate-title">CAIstellic Telescope</h2>
                <p className="activate-subtitle">Digital Sky Observatory</p>
                <button className="activate-btn" onClick={handleActivateTelescope}>
                  ACTIVATE
                </button>
              </div>
            )}

            {telescopeView === 'telescope' && (
              <div className="telescope-container active">
                <div id="aladin-lite-div"></div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="right-sidebar"></div>

          {/* Bottom bar */}
          <div className="bottom-bar">
            <button className="nav-link-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              ← BACK TO ENHANCEMENT
            </button>
            {telescopeView === 'telescope' && (
              <button className="capture-enhance-btn" onClick={handleCaptureAndEnhance}>
                CAPTURE & ENHANCE
              </button>
            )}
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>TELESCOPE ONLINE</span>
            </div>
          </div>
        </div>

        {/* Scroll up indicator */}
        <div className="scroll-indicator scroll-up" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ∧
        </div>

        {/* Telescope Help Modal */}
        {showTelescopeHelp && (
          <div className="help-overlay" onClick={() => setShowTelescopeHelp(false)}>
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

              <button onClick={() => setShowTelescopeHelp(false)} style={{ marginTop: '25px' }}>
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;