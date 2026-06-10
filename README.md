# 🌌 CAIstellar Observatory

**AI-Powered Astronomical Image Enhancement for OpenShift AI**

[![OpenShift AI](https://img.shields.io/badge/OpenShift-AI-purple)](https://www.redhat.com/en/technologies/cloud-computing/openshift/openshift-ai)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Astronomy](https://img.shields.io/badge/astronomy-AI-blueviolet)](https://github.com/sarabanderby/caistellar-observatory)

> Transform your telescope observations with AI-powered super-resolution enhancement

---

## 🔭 Overview

CAIstellar Observatory brings professional-grade AI image enhancement to amateur and professional astronomers alike. Upload telescope images, select celestial objects, and enhance them from 256x256 to 512x512 resolution using the SwinIR AI model - all running on Red Hat OpenShift AI.

Perfect for:
- 🌠 Amateur astronomers improving backyard telescope images
- 🏫 Educational institutions and planetariums
- 🔬 Research labs enhancing archival observations
- 📷 Astrophotography enthusiasts

## ✨ Features

- **🎯 Precision Selection**: Drag-and-drop selection box for targeting celestial objects
- **🔍 Zoom Controls**: Mouse wheel zoom to inspect fine details
- **🤖 AI Enhancement**: SwinIR transformer model provides 2x super-resolution
- **📸 Live Capture**: Connect telescope cameras or webcams
- **🌌 Space-Themed UI**: Deep space aesthetic with nebula colors
- **☁️ Cloud Native**: Fully containerized deployment on OpenShift

## 🚀 Quick Start

```bash
# Create namespace
oc new-project caistellar

# Deploy with Helm
helm install caistellar ./caistellar \
  --namespace caistellar \
  --set model.deploy=true

# Get application URL
oc get route caistellar -n caistellar
```

Visit the route URL and start enhancing your astronomical images!

## 📋 Prerequisites

- **OpenShift 4.12+** with OpenShift AI operator installed
- **Helm 3.x**
- **oc CLI** configured and authenticated
- **4 CPU cores, 6-8GB RAM** for model serving

## 🏗️ Architecture

```
┌─────────────────┐
│  Telescope /    │
│  Camera Feed    │
└────────┬────────┘
         │
┌────────▼────────────────────┐
│  Frontend (React)           │
│  • Space-themed UI          │
│  • Image upload/capture     │
│  • Selection box controls   │
└────────┬────────────────────┘
         │
┌────────▼────────────────────┐
│  Backend (FastAPI)          │
│  • Image preprocessing      │
│  • Tensor conversion        │
│  • Response handling        │
└────────┬────────────────────┘
         │
┌────────▼────────────────────┐
│  Model Server (MLServer)    │
│  • SwinIR ONNX model        │
│  • 256→1024 upscaling       │
│  • KServe v2 protocol       │
└─────────────────────────────┘
```

## 🎨 How It Works

1. **📤 Upload**: Load telescope image or capture from connected camera
2. **🎯 Select**: Drag the selection box over your target (galaxy, nebula, planet)
3. **🔍 Zoom**: Use mouse wheel to examine the pixelated details
4. **⚡ Enhance**: Click ENHANCE - AI upscales the selected area
   - Extracts 256x256 region
   - SwinIR model processes to 1024x1024 (4x)
   - Displays at 512x512 (2x) for optimal viewing
5. **📊 Compare**: View before/after side-by-side

## 🌟 Use Cases

### Amateur Astronomy
- Enhance backyard telescope observations
- Improve planetary detail from webcam captures
- Extract more information from light-polluted images

### Research & Archives
- Upscale historical photographic plates
- Enhance legacy telescope data
- Recover detail from digitized film archives

### Education
- Create stunning displays for planetariums
- Improve student observation images
- Demonstrate image processing techniques

### Astrophotography
- Enhance deep-sky object details
- Improve resolution of widefield captures
- Recover detail from tracked exposures

## 🎛️ Configuration

### Custom Resources

```bash
helm install caistellar ./caistellar \
  --set model.resources.requests.cpu=2 \
  --set model.resources.requests.memory=4Gi \
  --set model.deploy=true
```

### Multiple Replicas

```bash
helm install caistellar ./caistellar \
  --set frontend.replicaCount=2 \
  --set backend.replicaCount=2 \
  --set model.deploy=true
```

### Custom Namespace

```bash
helm install caistellar ./caistellar \
  --namespace my-observatory \
  --create-namespace \
  --set model.deploy=true
```

## 🐳 Container Images

Pre-built images on Quay.io:

- **Frontend**: `quay.io/sara_banderby/csi_cai:frontend`
- **Backend**: `quay.io/sara_banderby/csi_cai:backend`  
- **Model**: `quay.io/sara_banderby/csi_cai:model`

*Note: Images are shared with CSI:CAI project - astronomy UI theme coming soon!*

## 🤖 Model Details

- **Model**: [SwinIR](https://github.com/JingyunLiang/SwinIR) - Swin Transformer for Image Restoration
- **Paper**: [arxiv.org/abs/2108.10257](https://arxiv.org/abs/2108.10257)
- **Input**: 256×256 RGB image
- **Output**: 1024×1024 enhanced (4× upscaling)
- **Display**: Resized to 512×512 (2×) for usability
- **Runtime**: MLServer with ONNX backend on OpenShift AI
- **Performance**: ~30-60 seconds per image (CPU only)

## 🛠️ Troubleshooting

### Model pod not ready

Check MLServer runtime:
```bash
oc get servingruntime -n caistellar
oc logs deployment/caistellar-predictor -n caistellar
```

### Enhancement timeout

Increase backend timeout in values.yaml or wait longer - model processing takes 30-60s on CPU.

### Route not accessible

Verify route creation:
```bash
oc get route -n caistellar
oc describe route caistellar -n caistellar
```

## 🗑️ Uninstall

```bash
helm uninstall caistellar -n caistellar
oc delete project caistellar
```

## 📚 Learn More

- [SwinIR Model Paper](https://arxiv.org/abs/2108.10257)
- [OpenShift AI Documentation](https://docs.redhat.com/en/documentation/red_hat_openshift_ai_self-managed)
- [Astrophotography Basics](https://en.wikipedia.org/wiki/Astrophotography)

## 🤝 Contributing

This is a demonstration project. For astronomy-specific enhancements or issues, please open a GitHub issue.

## 📜 License

MIT License - See [LICENSE](LICENSE) file

## 🙏 Credits

- **Built by**: CAI Team
- **Powered by**: Red Hat OpenShift AI
- **Model**: SwinIR by Jingyun Liang et al.
- **Base Images**: Red Hat UBI9
- **Inspiration**: The astronomical community 🌌

---

**🌠 Clear skies and sharp images!**

*If you find CAIstellar Observatory useful, please ⭐ star this repo!*
