import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // API endpoint - use backend route
  const API_ENDPOINT = window.location.hostname.includes('localhost')
    ? 'http://localhost:8080/api/enhance'
    : `${window.location.protocol}//${window.location.hostname.replace('caistellar', 'caistellar-backend')}/api/enhance`;

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

  const handleEnhance = async () => {
    if (!image) {
      setError('Please upload an image first');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await axios.post(API_ENDPOINT, {
        image: image
      }, {
        timeout: 300000
      });

      if (response.data && response.data.enhanced_image) {
        setEnhancedImage(`data:image/png;base64,${response.data.enhanced_image}`);
      } else {
        setError('No enhanced image returned from server');
      }
    } catch (err) {
      console.error('Enhancement error:', err);
      setError(err.response?.data?.detail || err.message || 'Enhancement failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="App">
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
              Welcome to the<br />
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
              <button className="nav-item" onClick={() => setShowHelp(true)}>
                About
              </button>
            </div>
          </div>
          <div className="left-footer">
            <span>01</span>
            <span>02</span>
            <span>03</span>
          </div>
        </div>

        {/* Center content */}
        <div className="center-content">
          {!image && !enhancedImage && (
            <div className="welcome-screen">
              <div className="celestial-object"></div>
              <div className="scroll-indicator">∨</div>
            </div>
          )}

          {image && !enhancedImage && (
            <div className="image-viewer">
              <img src={image} alt="Uploaded" style={{ maxWidth: '80%', maxHeight: '70vh', borderRadius: '4px' }} />
              <button className="enhance-btn" onClick={handleEnhance} disabled={processing}>
                {processing ? 'PROCESSING...' : 'ENHANCE'}
              </button>
            </div>
          )}

          {enhancedImage && (
            <div className="image-viewer">
              <div className="enhanced-panel">
                <h3>Enhanced Result</h3>
                <img src={enhancedImage} alt="Enhanced" />
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="right-sidebar">
          <div className="info-item">
            <span className="info-label">Mission</span>
            <span className="info-value">Voyager</span>
          </div>
          <div className="info-item">
            <span className="info-label">AI Model</span>
            <span className="info-value">SwinIR</span>
          </div>
          <div className="info-item">
            <span className="info-label">Resolution</span>
            <span className="info-value">256→512</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status</span>
            <span className="info-value">{processing ? 'Processing' : 'Ready'}</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bottom-bar">
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>SYSTEM ONLINE</span>
          </div>
          <div className="brand">SC</div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>CAIstellar Observatory</h2>
            <p>
              <strong>1. LOAD OBSERVATION</strong><br />
              Click Upload to load telescope image or Camera to connect live feed
            </p>
            <p>
              <strong>2. ENHANCE</strong><br />
              Click ENHANCE button to process with AI super-resolution
            </p>
            <p>
              <strong>3. VIEW RESULTS</strong><br />
              Enhanced image appears at 2x resolution (256x256 → 512x512)
            </p>
            <p style={{ marginTop: '30px', fontSize: '0.85rem', opacity: 0.7 }}>
              Powered by SwinIR AI model on OpenShift AI
            </p>
            <button onClick={() => setShowHelp(false)} style={{ marginTop: '20px' }}>
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
    </div>
  );
}

export default App;
