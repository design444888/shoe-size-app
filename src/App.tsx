import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Camera,
  Scan,
  Cpu,
  ShieldCheck,
  FileText,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  ShoppingBag,
  Globe,
  Info,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { translations } from './translations';

type Step = 'welcome' | 'permissions' | 'setup' | 'scanning' | 'processing' | 'results';
type ReferenceObject = 'A4_PAPER' | 'CREDIT_CARD';



const App: React.FC = () => {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = translations[lang];
  const [step, setStep] = useState<Step>('welcome');
  const [progress, setProgress] = useState(0);
  const [refObject, setRefObject] = useState<ReferenceObject>('A4_PAPER');
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedAngles, setCapturedAngles] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar');

  // Camera Logic
  useEffect(() => {
    if (step === 'scanning') {
      const initCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera error:", err);
          alert(lang === 'ar' ? "عافاك عطينا الإذن للكاميرا باش نقدروا نعبروا ليك رجلك." : "Please grant camera permissions to use the scanner.");
          setStep('permissions');
        }
      };
      initCamera();

      const scanInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(scanInterval);
            setTimeout(() => setStep('processing'), 1000);
            return 100;
          }
          const next = prev + 0.5;
          if (Math.floor(next / 12.5) > capturedAngles) {
            setCapturedAngles(Math.floor(next / 12.5));
          }
          return next;
        });
      }, 50);

      return () => {
        clearInterval(scanInterval);
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      };
    }
  }, [step, capturedAngles, lang]);

  // Processing Simulation
  useEffect(() => {
    if (step === 'processing') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('results'), 800);
            return 100;
          }
          return prev + 1;
        });
      }, 40);
      return () => clearInterval(interval);
    }
  }, [step]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  return (
    <div className={`app-container ${t.font}`} dir={t.dir}>
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      {/* Language Switcher - Floating Design */}
      <button 
        onClick={toggleLang} 
        className="lang-switcher-glass"
      >
        <div className="lang-icon">
          <Globe size={16} />
        </div>
        <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
      </button>

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mobile-hero"
          >
            <div className="status-badge" style={{ width: 'fit-content', margin: '0 auto 20px' }}>
              <span className="permission-status"></span> {t.version}
            </div>
            <h1>
              {t.welcome.split('3D')[0]}
              <span className="gradient-text">3D</span>
              {t.welcome.split('3D')[1]}
            </h1>
            <p>{t.subWelcome}</p>
            
            <div className="btn-group">
              <button className="neon-btn" onClick={() => setStep('permissions')}>
                {t.startBtn} <ArrowRight size={20} className="icon-flip" />
              </button>
              <button className="outline-btn">{t.demoBtn}</button>
            </div>

            <div className="stats-row">
              <div><strong>99.8%</strong><span>{t.precision}</span></div>
              <div><strong>120k+</strong><span>{t.scans}</span></div>
            </div>

            <div className="scan-viewport" style={{ marginTop: '40px', height: '200px' }}>
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600"
                alt="Product Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
              />
              <div className="scan-line"></div>
            </div>
          </motion.div>
        )}

        {step === 'permissions' && (
          <motion.div
            key="permissions"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-panel step-card"
          >
            <div className="icon-box" style={{ margin: '0 auto 30px', background: 'rgba(142, 45, 226, 0.1)', color: 'var(--accent)' }}>
              <ShieldCheck size={28} />
            </div>
            <h2>{t.permissions.split(' ')[0]} <span className="gradient-text">{t.permissions.split(' ')[1]}</span></h2>
            <p style={{ color: 'var(--text-muted)' }}>{t.perSub}</p>

            <div className="permissions-list">
              <div className="permission-item">
                <Camera size={20} color="var(--primary-glow)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{t.camAccess}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.camDesc}</div>
                </div>
                <div className="permission-status"></div>
              </div>
              <div className="permission-item">
                <Smartphone size={20} color="var(--primary-glow)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{t.motionAccess}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.motionDesc}</div>
                </div>
                <div className="permission-status"></div>
              </div>
              <div className="permission-item">
                <Info size={20} color="var(--primary-glow)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{t.storageAccess}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.storageDesc}</div>
                </div>
                <div className="permission-status"></div>
              </div>
            </div>

            <div className="btn-group">
              <button className="neon-btn" style={{ justifyContent: 'center' }} onClick={() => setStep('setup')}>
                {t.agree}
              </button>
              <button className="outline-btn" style={{ justifyContent: 'center', gap: '8px' }} onClick={() => setStep('welcome')}>
                <ArrowLeft size={18} className="icon-flip" /> {t.backBtn}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div
            key="setup"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mobile-hero"
          >
            <h2 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{t.setup.split(' ')[0]} <span className="gradient-text">{t.setup.split(' ')[1]}</span></h2>
            <p>{t.setupSub}</p>

            <div className="btn-group" style={{ textAlign: 'initial' }}>
              <div
                className={`glass-panel setup-card ${refObject === 'A4_PAPER' ? 'active' : ''}`}
                onClick={() => setRefObject('A4_PAPER')}
              >
                <div className="icon-box" style={{ margin: '0 0 20px' }}>
                  <FileText size={24} />
                </div>
                <h3>{t.a4}</h3>
                <p>{t.a4Desc}</p>
              </div>

              <div
                className={`glass-panel setup-card ${refObject === 'CREDIT_CARD' ? 'active' : ''}`}
                onClick={() => setRefObject('CREDIT_CARD')}
              >
                <div className="icon-box" style={{ margin: '0 0 20px' }}>
                  <CreditCard size={24} />
                </div>
                <h3>{t.card}</h3>
                <p>{t.cardDesc}</p>
              </div>
            </div>

            <div className="glass-panel" style={{ marginTop: '40px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'initial' }}>
              <AlertCircle size={24} color="var(--scanning-warn)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.tip}</p>
            </div>

            <div className="btn-group">
              <button className="neon-btn" style={{ justifyContent: 'center' }} onClick={() => setStep('scanning')}>
                {t.launchBtn} <Scan size={20} />
              </button>
              <button className="outline-btn" style={{ justifyContent: 'center', gap: '8px' }} onClick={() => setStep('permissions')}>
                <ArrowLeft size={18} className="icon-flip" /> {t.backBtn}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 100, background: '#000' }}
          >
            <div className="camera-preview-container" style={{ maxWidth: 'none', height: '100%', borderRadius: 0 }}>
              <video
                ref={videoRef}
                className="camera-video"
                autoPlay
                playsInline
              />

              <div className="scan-status-overlay">
                <div className="status-badge">
                  <span className="permission-status"></span> {t.scanning}
                </div>
                <div className="status-badge" style={{ color: 'var(--primary-glow)' }}>
                  {capturedAngles}/8 {t.angles}
                </div>
              </div>

              <div className="calibration-frame">
                <svg className="ar-scan-circle">
                  <circle cx="125" cy="125" r="110" style={{ strokeDashoffset: 785 - (785 * scanProgress / 100) }} />
                </svg>
                {scanProgress < 20 && (
                  <div className="animate-pulse-ui" style={{ position: 'absolute', bottom: '-40px', color: '#fff', fontSize: '0.8rem' }}>
                    {t.moveSlowly}
                  </div>
                )}
              </div>

              <div style={{ position: 'absolute', bottom: '40px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>{t.scanProgress}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{Math.floor(scanProgress)}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>{t.detected}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-glow)' }}>YES</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-panel step-card"
          >
            <div className="icon-box animate-pulse-ui" style={{ margin: '0 auto 30px' }}>
              <Cpu size={28} />
            </div>
            <h2 style={{ marginBottom: '10px' }}>{t.processing.split(' ')[0]} <span className="gradient-text">{t.processing.split(' ').slice(1).join(' ')}</span></h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>{t.procSub}</p>

            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '15px' }}>
              <motion.div
                style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary-glow), var(--secondary-glow))', width: `${progress}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>{progress < 30 ? t.triangulating : progress < 70 ? t.calibrating : t.exporting}</span>
              <span>{progress}%</span>
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mobile-hero"
            style={{ paddingBottom: '100px' }}
          >
            <div className="status-badge" style={{ marginBottom: '20px', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', margin: '0 auto' }}>
              <CheckCircle2 size={14} /> SCAN VERIFIED
            </div>
            <h2 style={{ fontSize: '2.5rem', margin: '20px 0' }}>{t.results.split(' ')[0]} <span className="gradient-text">{t.results.split(' ').slice(1).join(' ')}</span></h2>
            <p>{t.resSub}</p>

            <div className="metric-grid" style={{ marginTop: '30px' }}>
              <div className="metric-card">
                <span>{t.length}</span>
                <strong>26.85 cm</strong>
              </div>
              <div className="metric-card">
                <span>{t.width}</span>
                <strong>10.12 cm</strong>
              </div>
              <div className="metric-card">
                <span>{t.arch}</span>
                <strong>{t.highArch}</strong>
              </div>
              <div className="metric-card">
                <span>{t.standard}</span>
                <strong>ISO 9407</strong>
              </div>
            </div>

            <div className="glass-panel" style={{ marginTop: '30px', padding: '20px', textAlign: 'initial' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingBag size={20} className="gradient-text" /> {t.standards}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div className="metric-card" style={{ textAlign: 'center', padding: '10px' }}>
                  <span style={{ fontSize: '0.6rem' }}>{t.us}</span>
                  <strong style={{ fontSize: '1rem' }}>9.5</strong>
                </div>
                <div className="metric-card" style={{ textAlign: 'center', padding: '10px' }}>
                  <span style={{ fontSize: '0.6rem' }}>{t.uk}</span>
                  <strong style={{ fontSize: '1rem' }}>8.5</strong>
                </div>
                <div className="metric-card" style={{ textAlign: 'center', padding: '10px', borderColor: 'var(--primary-glow)' }}>
                  <span style={{ fontSize: '0.6rem' }}>{t.eu}</span>
                  <strong style={{ fontSize: '1rem' }}>43</strong>
                </div>
              </div>

              <div className="brand-row">
                <span>Nike / Jordan</span>
                <strong>43 (9.5)</strong>
              </div>
              <div className="brand-row">
                <span>Adidas / Yeezy</span>
                <strong>43 1/3 (9.5)</strong>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '15px' }}>
                {t.optimized}
              </p>
            </div>

            <div className="btn-group">
              <button className="neon-btn" style={{ justifyContent: 'center' }}>
                {t.exportBtn}
              </button>
              <button className="outline-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }} onClick={() => setStep('setup')}>
                <RotateCcw size={18} /> {t.newScan}
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '0', position: 'relative', height: '250px', overflow: 'hidden', borderRadius: '24px', marginTop: '20px' }}>
              <div className="scan-line" style={{ animationDuration: '4s' }}></div>
              <img
                src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800"
                alt="3D Foot Scan"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
              />
              <div style={{ position: 'absolute', bottom: '15px', left: '15px', right: '15px' }}>
                <div className="glass-panel" style={{ padding: '10px 15px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{t.mesh}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--scanning-active)' }}>{t.active}</span>
                  </div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '1.5px' }}>
                    <div style={{ width: '85%', height: '100%', background: 'var(--primary-glow)', borderRadius: '1.5px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', gap: '15px', zIndex: 50, whiteSpace: 'nowrap' }}>
        <span>ENGINE: SHU-SCAN X4</span>
        <span>CV: OPENCV-JS 4.9</span>
        <span>ML: TENSORFLOW-WEB</span>
      </footer>
    </div>
  );
};

export default App;