# 📱 QR Studio Pro — QR Code Generator & Designer

A client-side web application built for the **Google Developer Groups (GDG) on Campus SRM — Recruitment 2026-27 (Frontend Task 1)**.

![Status](https://img.shields.io/badge/Status-Completed-success)
![Framework](https://img.shields.io/badge/Framework-React_18_+_Vite-61dafb)
![Storage](https://img.shields.io/badge/Storage-LocalStorage-blueviolet)
![Execution](https://img.shields.io/badge/Runtime-100%25_Browser_Native-brightgreen)

---

Live Website !!! https://qr-generator-five-flame.vercel.app

## ✨ Features Implemented

### 1. ⚡ Real-Time QR Generation
- Live rendering on an HTML5 `<canvas>` with instant reactivity as users type or change parameters.
- Built strictly client-side using `qrcode` — zero backend or external API dependencies.

### 2. 🗂️ Supported QR Content Types
- **URL**: Generates instant website links with protocol validation (`https://`).
- **Plain Text**: Encode arbitrary text notes or messages with live multi-line input.
- **Email**: Pre-configures standard `mailto:` links with subject and pre-filled message body.
- **Phone Number**: Encodes `tel:` links enabling 1-tap phone calls on mobile devices.
- **Wi-Fi**: Encodes `WIFI:S:...;T:...;P:...;` format supporting WPA/WPA2/WPA3, WEP, and Open networks.

### 3. 🎨 Full Appearance Customization
- **Color Customization**: Independent color pickers for Foreground (pattern) and Background.
- **Dimension Controls**: Fine-grained slider for QR resolution (150px to 600px).
- **Quiet Zone Margin**: Custom margin/padding controls (0 to 6 blocks).
- **Error Correction Levels**: Selectable between **L (7%)**, **M (15%)**, **Q (25%)**, and **H (30%)**.

### 4. 🎭 Curated Visual Presets
Includes 1-click styling themes with customizable post-selection controls:
- **Classic Dark** (Monochrome black & white)
- **Cyber Indigo** (Deep indigo with frosted background)
- **Emerald Forest** (Forest green with mint wash)
- **Crimson Velvet** (Vibrant red accent)
- **Midnight Gold** (Dark mode with warm gold pattern)
- **Slate Minimal** (Modern neutral slate theme)

### 5. 🔍 Scan Reliability Guard
- Automated luminance-contrast calculation between foreground and background.
- Alerts user with a warning banner if contrast is too low (< 2.5:1) to prevent unreadable codes.

### 6. 💾 Export & Sharing
- **PNG Download**: Downloads high-resolution raster image matching exact canvas styling + celebration animation.
- **SVG Download**: High-resolution vector export for scalable printing and graphic design.
- **Copy to Clipboard**: Copies the generated image directly to your clipboard for pasting.

### 7. 🕒 Persistent History (Recent QR Codes)
- Automatically stores recently generated codes into browser `localStorage`.
- Persists across page refreshes and reboots.
- 1-click restoration of all previous settings and input values.
- Individual item deletion or 1-click "Clear All".

### 8. 🌓 Theme & Responsive UI
- Complete Dark / Light mode toggle with persistent state.
- Fully responsive layout adapting from mobile devices to desktop monitors.
- Designed with **Google Fonts (Plus Jakarta Sans & JetBrains Mono)** and modern glassmorphic styling.

---

<img width="1919" height="1080" alt="image" src="https://github.com/user-attachments/assets/9e7d6652-3a19-4cb1-bb4e-3c45d5948c76" />

<img width="1810" height="876" alt="image" src="https://github.com/user-attachments/assets/a193d989-2813-45ef-947f-a40169512490" />

<img width="1919" height="1080" alt="image" src="https://github.com/user-attachments/assets/362365d3-b54a-4f4a-9851-3b3452c6b203" />

## 🧪 Testing Checklist Verification

- [x] Tested URL, Plain Text, Email, Phone, and Wi-Fi data formats.
- [x] Verified error state notifications on invalid inputs.
- [x] Verified live canvas updates when moving sliders (size, margin, error correction).
- [x] Verified download for both PNG and vector SVG formats.
- [x] Verified clipboard copy functionality.
- [x] Verified scannability contrast indicator.
- [x] Verified persistence in `localStorage` across page reloads.
- [x] Tested both Light & Dark theme modes.
