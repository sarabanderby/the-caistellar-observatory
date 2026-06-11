import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

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
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const imageContainerRef = useRef(null);

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

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX - boxPosition.x, y: e.clientY - boxPosition.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    if (imageContainerRef.current) {
      const containerRect = imageContainerRef.current.getBoundingClientRect();
      let newX = e.clientX - dragStart.x - containerRect.left;
      let newY = e.clientY - dragStart.y - containerRect.top;

      // Keep box within container bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - 256));
      newY = Math.max(0, Math.min(newY, containerRect.height - 256));

      setBoxPosition({ x: newX, y: newY });
    }
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
              <div ref={imageContainerRef} style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  ref={imageRef}
                  src={image}
                  alt="Uploaded"
                  style={{ maxWidth: '600px', maxHeight: '600px', display: 'block', userSelect: 'none' }}
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
              <div className="enhanced-panel">
                <h3>Enhanced Result</h3>
                <img src={enhancedImage} alt="Enhanced" />
              </div>
              <button className="enhance-btn" onClick={clearImage} style={{ marginTop: '20px' }}>
                CLEAR IMAGE
              </button>
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
            <span className="info-label">Wavelength</span>
            <span className="info-value">Visible</span>
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
            <div className={systemOnline ? "status-dot" : "status-dot offline"}></div>
            <span>{systemOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '10px' }}>🌌 MISSION BRIEFING</h2>
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

            <p style={{ marginBottom: '15px' }}>
              <strong>OPERATION:</strong>
            </p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Upload: Load telescope image from file</p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Camera: Capture live feed from connected device</p>
            <p style={{ marginLeft: '20px', marginBottom: '5px' }}>▸ Target: Drag selection box over celestial object</p>
            <p style={{ marginLeft: '20px', marginBottom: '20px' }}>▸ Enhance: Process selected region with AI</p>

            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '25px' }}>
              This Quickstart serves as a reference architecture for deploying production AI workloads on OpenShift.
            </p>

            <button onClick={() => setShowHelp(false)} style={{ marginTop: '25px' }}>
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
