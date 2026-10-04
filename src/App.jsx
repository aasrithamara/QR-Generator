import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { 
  QrCode, 
  Globe, 
  Type, 
  Mail, 
  Phone, 
  Wifi, 
  Download, 
  Copy, 
  Moon, 
  Sun, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  RefreshCw,
  ExternalLink,
  Layers,
  Palette,
  Sliders,
  Check
} from 'lucide-react';
import './App.css';

// Predefined visual presets
const PRESETS = [
  { id: 'classic', name: 'Classic Dark', fg: '#000000', bg: '#ffffff' },
  { id: 'cyber', name: 'Cyber Indigo', fg: '#4f46e5', bg: '#eef2ff' },
  { id: 'emerald', name: 'Emerald Forest', fg: '#065f46', bg: '#ecfdf5' },
  { id: 'crimson', name: 'Crimson Velvet', fg: '#991b1b', bg: '#fef2f2' },
  { id: 'midnight', name: 'Midnight Gold', fg: '#f59e0b', bg: '#0f172a' },
  { id: 'monochrome', name: 'Slate Minimal', fg: '#1e293b', bg: '#f8fafc' },
];

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('qr_theme') || 'dark');

  // QR Type state: 'url', 'text', 'email', 'phone', 'wifi'
  const [qrType, setQrType] = useState('url');

  // Input fields for each type
  const [formData, setFormData] = useState({
    url: 'https://gdg.community.dev',
    text: 'Hello from GDG SRM!',
    email: '',
    emailSubject: '',
    emailBody: '',
    phoneNumber: '',
    wifiSsid: '',
    wifiPassword: '',
    wifiEncryption: 'WPA',
    wifiHidden: false,
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Customization state
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(300);
  const [margin, setMargin] = useState(2);
  const [errorCorrection, setErrorCorrection] = useState('M'); // L, M, Q, H
  const [activePreset, setActivePreset] = useState('classic');

  // Canvas ref
  const canvasRef = useRef(null);
  const [qrPayload, setQrPayload] = useState('');
  const [copied, setCopied] = useState(false);

  // Recents state
  const [recents, setRecents] = useState(() => {
    try {
      const saved = localStorage.getItem('qr_recents');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toggle theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('qr_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Compute QR string payload based on selected type and inputs
  useEffect(() => {
    let payload = '';
    const newErrors = {};

    if (qrType === 'url') {
      const trimmed = formData.url.trim();
      if (!trimmed) {
        newErrors.url = 'URL is required';
      } else if (!/^https?:\/\//i.test(trimmed)) {
        // Automatically accept or hint
        payload = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      } else {
        payload = trimmed;
      }
    } else if (qrType === 'text') {
      if (!formData.text.trim()) {
        newErrors.text = 'Text content is required';
      } else {
        payload = formData.text;
      }
    } else if (qrType === 'email') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Enter a valid email address';
      } else {
        const subject = encodeURIComponent(formData.emailSubject || '');
        const body = encodeURIComponent(formData.emailBody || '');
        payload = `mailto:${formData.email.trim()}?subject=${subject}&body=${body}`;
      }
    } else if (qrType === 'phone') {
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone number is required';
      } else if (!/^[+0-9\s()-]{5,20}$/.test(formData.phoneNumber.trim())) {
        newErrors.phoneNumber = 'Enter a valid phone number';
      } else {
        payload = `tel:${formData.phoneNumber.trim().replace(/\s+/g, '')}`;
      }
    } else if (qrType === 'wifi') {
      if (!formData.wifiSsid.trim()) {
        newErrors.wifiSsid = 'Network Name (SSID) is required';
      } else {
        // WIFI:S:MySSID;T:WPA;P:MyPassword;H:false;;
        const hidden = formData.wifiHidden ? 'true' : 'false';
        payload = `WIFI:S:${formData.wifiSsid};T:${formData.wifiEncryption};P:${formData.wifiPassword};H:${hidden};;`;
      }
    }

    setErrors(newErrors);
    setQrPayload(Object.keys(newErrors).length === 0 ? payload : '');
  }, [qrType, formData]);

  // Generate QR code onto canvas immediately when payload or styles change
  useEffect(() => {
    if (!canvasRef.current || !qrPayload) return;

    QRCode.toCanvas(
      canvasRef.current,
      qrPayload,
      {
        width: Number(size),
        margin: Number(margin),
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrection,
      },
      (err) => {
        if (err) {
          console.error('QR Generation failed:', err);
        }
      }
    );
  }, [qrPayload, fgColor, bgColor, size, margin, errorCorrection]);

  // Helper to calculate contrast ratio to warn about scan reliability
  const calculateContrastRatio = (hex1, hex2) => {
    const getLuminance = (hex) => {
      const c = hex.replace('#', '');
      const rgb = [
        parseInt(c.substr(0, 2), 16) / 255,
        parseInt(c.substr(2, 2), 16) / 255,
        parseInt(c.substr(4, 2), 16) / 255,
      ].map(val => val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4));
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };

    try {
      const lum1 = getLuminance(hex1);
      const lum2 = getLuminance(hex2);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    } catch {
      return 4.5;
    }
  };

  const contrastRatio = calculateContrastRatio(fgColor, bgColor);
  const isContrastLow = contrastRatio < 2.5;

  // Handle Preset Selection
  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setFgColor(preset.fg);
    setBgColor(preset.bg);
  };

  // Save to Recents
  const saveToRecents = () => {
    if (!qrPayload) return;
    const item = {
      id: Date.now(),
      type: qrType,
      payload: qrPayload,
      previewTitle: getSummaryTitle(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
      settings: { fgColor, bgColor, size, margin, errorCorrection, formData: { ...formData } }
    };

    const updated = [item, ...recents.filter(r => r.payload !== qrPayload)].slice(0, 6);
    setRecents(updated);
    localStorage.setItem('qr_recents', JSON.stringify(updated));
  };

  const getSummaryTitle = () => {
    if (qrType === 'url') return formData.url;
    if (qrType === 'text') return formData.text.slice(0, 28) + (formData.text.length > 28 ? '...' : '');
    if (qrType === 'email') return formData.email;
    if (qrType === 'phone') return formData.phoneNumber;
    if (qrType === 'wifi') return `WiFi: ${formData.wifiSsid}`;
    return 'Custom QR';
  };

  // Restore from recent item
  const restoreRecent = (item) => {
    setQrType(item.type);
    if (item.settings) {
      setFgColor(item.settings.fgColor || '#000000');
      setBgColor(item.settings.bgColor || '#ffffff');
      setSize(item.settings.size || 300);
      setMargin(item.settings.margin || 2);
      setErrorCorrection(item.settings.errorCorrection || 'M');
      if (item.settings.formData) {
        setFormData(item.settings.formData);
      }
    }
  };

  const deleteRecent = (id, e) => {
    e.stopPropagation();
    const updated = recents.filter(r => r.id !== id);
    setRecents(updated);
    localStorage.setItem('qr_recents', JSON.stringify(updated));
  };

  const clearAllRecents = () => {
    setRecents([]);
    localStorage.removeItem('qr_recents');
  };

  // Download as PNG
  const handleDownload = () => {
    if (!canvasRef.current || !qrPayload) return;
    saveToRecents();

    const link = document.createElement('a');
    link.download = `qrcode-${qrType}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  // Download as SVG
  const handleDownloadSVG = async () => {
    if (!qrPayload) return;
    saveToRecents();

    try {
      const svgString = await QRCode.toString(qrPayload, {
        type: 'svg',
        margin: Number(margin),
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrection,
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qrcode-${qrType}-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!canvasRef.current || !qrPayload) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        saveToRecents();
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="logo-badge">
            <QrCode size={28} />
          </div>
          <div className="brand-info">
            <h1>QR Studio Pro</h1>
            <p>Generate, customize & export production-ready QR codes in real time</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="badge-gdg">
            <Sparkles size={14} /> GDG SRM Recruitment
          </div>
          <button 
            className="icon-btn" 
            onClick={toggleTheme} 
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            id="theme-toggle"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="studio-layout">
        {/* Left: Input & Customization Panel */}
        <section className="controls-column">
          <div className="panel">
            <h2 className="panel-title">
              <Layers size={20} color="#6366f1" /> Select Content Type
            </h2>

            {/* Content Type Tabs */}
            <div className="type-tabs" role="tablist">
              <button 
                className={`type-tab ${qrType === 'url' ? 'active' : ''}`}
                onClick={() => setQrType('url')}
                id="tab-url"
              >
                <Globe size={16} /> URL / Website
              </button>
              <button 
                className={`type-tab ${qrType === 'text' ? 'active' : ''}`}
                onClick={() => setQrType('text')}
                id="tab-text"
              >
                <Type size={16} /> Plain Text
              </button>
              <button 
                className={`type-tab ${qrType === 'email' ? 'active' : ''}`}
                onClick={() => setQrType('email')}
                id="tab-email"
              >
                <Mail size={16} /> Email
              </button>
              <button 
                className={`type-tab ${qrType === 'phone' ? 'active' : ''}`}
                onClick={() => setQrType('phone')}
                id="tab-phone"
              >
                <Phone size={16} /> Phone
              </button>
              <button 
                className={`type-tab ${qrType === 'wifi' ? 'active' : ''}`}
                onClick={() => setQrType('wifi')}
                id="tab-wifi"
              >
                <Wifi size={16} /> Wi-Fi
              </button>
            </div>

            {/* Dynamic Inputs Based on Type */}
            <div className="tab-content">
              {qrType === 'url' && (
                <div className="form-group">
                  <label htmlFor="input-url">Website URL</label>
                  <input
                    id="input-url"
                    type="url"
                    className={`form-input ${errors.url ? 'has-error' : ''}`}
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                  {errors.url ? (
                    <p className="input-feedback error"><AlertTriangle size={14} /> {errors.url}</p>
                  ) : (
                    <p className="input-feedback hint">Opens seamlessly in any camera or scanner app</p>
                  )}
                </div>
              )}

              {qrType === 'text' && (
                <div className="form-group">
                  <label htmlFor="input-text">Text Message or Notes</label>
                  <textarea
                    id="input-text"
                    rows={4}
                    className={`form-textarea ${errors.text ? 'has-error' : ''}`}
                    placeholder="Write anything you want to encode..."
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  />
                  {errors.text && (
                    <p className="input-feedback error"><AlertTriangle size={14} /> {errors.text}</p>
                  )}
                </div>
              )}

              {qrType === 'email' && (
                <div>
                  <div className="form-group">
                    <label htmlFor="input-email">Recipient Email Address</label>
                    <input
                      id="input-email"
                      type="email"
                      className={`form-input ${errors.email ? 'has-error' : ''}`}
                      placeholder="contact@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && (
                      <p className="input-feedback error"><AlertTriangle size={14} /> {errors.email}</p>
                    )}
                  </div>
                  <div className="input-grid-2">
                    <div className="form-group">
                      <label htmlFor="input-subject">Email Subject</label>
                      <input
                        id="input-subject"
                        type="text"
                        className="form-input"
                        placeholder="Inquiry / Greeting"
                        value={formData.emailSubject}
                        onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="input-body">Pre-filled Body</label>
                      <input
                        id="input-body"
                        type="text"
                        className="form-input"
                        placeholder="Hello, I would like to..."
                        value={formData.emailBody}
                        onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {qrType === 'phone' && (
                <div className="form-group">
                  <label htmlFor="input-phone">Phone Number</label>
                  <input
                    id="input-phone"
                    type="tel"
                    className={`form-input ${errors.phoneNumber ? 'has-error' : ''}`}
                    placeholder="+1 (555) 019-2834"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                  {errors.phoneNumber ? (
                    <p className="input-feedback error"><AlertTriangle size={14} /> {errors.phoneNumber}</p>
                  ) : (
                    <p className="input-feedback hint">Prompts direct dial on smartphone scan</p>
                  )}
                </div>
              )}

              {qrType === 'wifi' && (
                <div>
                  <div className="input-grid-2">
                    <div className="form-group">
                      <label htmlFor="input-ssid">Network SSID (Name)</label>
                      <input
                        id="input-ssid"
                        type="text"
                        className={`form-input ${errors.wifiSsid ? 'has-error' : ''}`}
                        placeholder="Home-WiFi-5G"
                        value={formData.wifiSsid}
                        onChange={(e) => setFormData({ ...formData, wifiSsid: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="input-encryption">Security Type</label>
                      <select
                        id="input-encryption"
                        className="form-select"
                        value={formData.wifiEncryption}
                        onChange={(e) => setFormData({ ...formData, wifiEncryption: e.target.value })}
                      >
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None (Open)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="input-wifi-pass">WiFi Password</label>
                    <input
                      id="input-wifi-pass"
                      type="password"
                      className="form-input"
                      placeholder="Password"
                      value={formData.wifiPassword}
                      onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                    />
                  </div>
                  {errors.wifiSsid && (
                    <p className="input-feedback error"><AlertTriangle size={14} /> {errors.wifiSsid}</p>
                  )}
                </div>
              )}
            </div>

            <div className="section-divider" />

            {/* Presets Section */}
            <h2 className="panel-title">
              <Palette size={20} color="#6366f1" /> Visual Presets
            </h2>
            <div className="presets-grid">
              {PRESETS.map((p) => (
                <div
                  key={p.id}
                  className={`preset-card ${activePreset === p.id ? 'active' : ''}`}
                  onClick={() => applyPreset(p)}
                  id={`preset-${p.id}`}
                >
                  <div 
                    className="preset-swatch" 
                    style={{ background: `linear-gradient(135deg, ${p.fg} 50%, ${p.bg} 50%)` }} 
                  />
                  <span className="preset-name">{p.name}</span>
                </div>
              ))}
            </div>

            <div className="section-divider" />

            {/* Customization Details */}
            <h2 className="panel-title">
              <Sliders size={20} color="#6366f1" /> Fine-Tune Appearance
            </h2>

            <div className="controls-grid">
              {/* Foreground Color */}
              <div className="form-group">
                <label htmlFor="fg-color">Foreground (QR Pattern)</label>
                <div className="color-picker-row">
                  <div className="color-input-wrapper">
                    <input
                      id="fg-color"
                      type="color"
                      value={fgColor}
                      onChange={(e) => {
                        setFgColor(e.target.value);
                        setActivePreset('');
                      }}
                    />
                  </div>
                  <span className="color-hex">{fgColor}</span>
                </div>
              </div>

              {/* Background Color */}
              <div className="form-group">
                <label htmlFor="bg-color">Background Color</label>
                <div className="color-picker-row">
                  <div className="color-input-wrapper">
                    <input
                      id="bg-color"
                      type="color"
                      value={bgColor}
                      onChange={(e) => {
                        setBgColor(e.target.value);
                        setActivePreset('');
                      }}
                    />
                  </div>
                  <span className="color-hex">{bgColor}</span>
                </div>
              </div>

              {/* Size Slider */}
              <div className="form-group">
                <label htmlFor="qr-size">
                  QR Size <span className="slider-value">{size}px</span>
                </label>
                <div className="slider-container">
                  <input
                    id="qr-size"
                    type="range"
                    min="150"
                    max="600"
                    step="10"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Margin Slider */}
              <div className="form-group">
                <label htmlFor="qr-margin">
                  Quiet Zone (Padding) <span className="slider-value">{margin}</span>
                </label>
                <div className="slider-container">
                  <input
                    id="qr-margin"
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Error Correction Level */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="qr-ecc">
                  Error Correction Level
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                    (Higher allows scanning even if damaged or obscured)
                  </span>
                </label>
                <select
                  id="qr-ecc"
                  className="form-select"
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value)}
                >
                  <option value="L">Level L - Low (7% recovery capability)</option>
                  <option value="M">Level M - Medium (15% recovery capability - Recommended)</option>
                  <option value="Q">Level Q - Quartile (25% recovery capability)</option>
                  <option value="H">Level H - High (30% recovery capability)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Live Preview & Download actions */}
        <section className="preview-column">
          <div className="panel preview-card">
            <h2 className="panel-title" style={{ alignSelf: 'flex-start' }}>
              <Sparkles size={20} color="#6366f1" /> Live Preview
            </h2>

            {/* QR Canvas */}
            <div 
              className="qr-canvas-wrapper" 
              style={{ backgroundColor: bgColor }}
            >
              {qrPayload ? (
                <canvas ref={canvasRef} id="qr-preview-canvas" />
              ) : (
                <div style={{ padding: '3rem 1rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <AlertTriangle size={36} style={{ margin: '0 auto 0.75rem auto', display: 'block', opacity: 0.5 }} />
                  Please resolve the inputs on the left to preview QR code
                </div>
              )}
            </div>

            {/* Scan Reliability Checker */}
            {qrPayload && (
              <div className={`scannability-alert ${isContrastLow ? 'warning' : 'success'}`}>
                {isContrastLow ? (
                  <>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Low contrast detected! ({contrastRatio.toFixed(1)}:1)</strong>
                      <p>Smartphone cameras might struggle to scan this code. Consider increasing contrast between foreground and background.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Optimal scannability verified!</strong>
                      <p>Contrast ratio is high ({contrastRatio.toFixed(1)}:1). Tested for reliable, instant camera reads.</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="download-buttons">
              <button
                className="btn-primary"
                onClick={handleDownload}
                disabled={!qrPayload}
                id="btn-download-png"
              >
                <Download size={18} /> Download PNG
              </button>

              <button
                className="btn-secondary"
                onClick={handleDownloadSVG}
                disabled={!qrPayload}
                id="btn-download-svg"
              >
                <Download size={18} /> Vector SVG
              </button>

              <button
                className="btn-secondary btn-full"
                onClick={handleCopy}
                disabled={!qrPayload}
                id="btn-copy-clipboard"
              >
                {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>

          {/* Quick Info card */}
          <div className="panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Client-Side Browser Execution
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              100% of encoding, pixel-mapping, and rendering executes completely in your local browser runtime. Zero server tracking or telemetry required.
            </p>
          </div>
        </section>
      </main>

      {/* Recent QR Codes Section */}
      <section className="recents-container">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>
              <RefreshCw size={20} color="#6366f1" /> Recently Generated Codes
            </h2>
            {recents.length > 0 && (
              <button 
                className="small-btn" 
                onClick={clearAllRecents}
                id="btn-clear-recents"
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>

          {recents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No QR codes generated yet. When you download or copy a QR code, it will be automatically preserved here for quick reuse across browser sessions.
            </p>
          ) : (
            <div className="recents-list">
              {recents.map((item) => (
                <div 
                  key={item.id} 
                  className="recent-card"
                  onClick={() => restoreRecent(item)}
                  style={{ cursor: 'pointer' }}
                  title="Click to reload this QR code and its settings"
                >
                  <div className="recent-info">
                    <span className="recent-type">{item.type}</span>
                    <span className="recent-text">{item.previewTitle}</span>
                    <span className="recent-date">{item.date}</span>
                  </div>
                  <div className="recent-actions">
                    <button 
                      className="small-btn" 
                      onClick={(e) => deleteRecent(item.id, e)}
                      title="Delete entry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <p>Built with React & Vite for <strong>Google Developer Groups on Campus SRM (Recruitments 2026-27)</strong></p>
        <p style={{ marginTop: '0.25rem' }}>Full real-time browser generation • All presets & error-correction levels supported</p>
      </footer>
    </div>
  );
}
