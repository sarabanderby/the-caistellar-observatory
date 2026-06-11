import React, { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import axios from 'axios';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [boxPosition, setBoxPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);

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

  const clearImage = () => {
    setImage(null);
    setEnhancedImage(null);
    setError(null);
    setBoxPosition({ x: 100, y: 100 });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - boxPosition.x, y: e.clientY - boxPosition.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setBoxPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (ref) => {
    setZoom(ref.state.scale);
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

      // Get image position and dimensions
      const imgRect = img.getBoundingClientRect();

      // Calculate box position RELATIVE to the image
      const boxRelativeX = boxPosition.x - imgRect.left;
      const boxRelativeY = boxPosition.y - imgRect.top;

      // Scale from displayed size to natural size
      const scaleX = img.naturalWidth / imgRect.width;
      const scaleY = img.naturalHeight / imgRect.height;

      const sourceX = boxRelativeX * scaleX;
      const sourceY = boxRelativeY * scaleY;
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
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={4}
                  onZoomChange={handleZoomChange}
                  panning={{ disabled: true }}
                >
                  <TransformComponent>
                    <img
                      ref={imageRef}
                      src={image}
                      alt="Uploaded"
                      style={{ maxWidth: '600px', maxHeight: '600px', display: 'block' }}
                    />
                  </TransformComponent>
                </TransformWrapper>

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
              <strong>2. TARGET CELESTIAL OBJECT</strong><br />
              Drag the cyan box over the object you want to enhance
            </p>
            <p>
              <strong>3. ENHANCE</strong><br />
              Click ENHANCE button - selected 256x256 area is enhanced to 512x512 (2x)
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
