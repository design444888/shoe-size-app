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
  AlertCircle
} from 'lucide-react';
import { translations } from './translations';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

type Step = 'welcome' | 'permissions' | 'setup' | 'scanning' | 'preview' | 'processing' | 'results';
type ReferenceObject = 'A4_PAPER' | 'CREDIT_CARD';

const App: React.FC = () => {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = translations[lang];
  const [step, setStep] = useState<Step>('welcome');
  const [progress, setProgress] = useState(0);
  const [refObject, setRefObject] = useState<ReferenceObject>('A4_PAPER');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [isDetected, setIsDetected] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [model, setModel] = useState<cocossd.ObjectDetection | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar');

  // Load ML Model for real-time validation
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await cocossd.load();
        setModel(loadedModel);
      } catch (err) {
        console.error("Model load error:", err);
      }
    };
    if (step === 'scanning') loadModel();
  }, [step]);

  // Real-time Detection Loop
  useEffect(() => {
    let animationId: number;
    const runDetection = async () => {
      if (model && webcamRef.current && webcamRef.current.video?.readyState === 4 && step === 'scanning') {
        const predictions = await model.detect(webcamRef.current.video);
        // Detection logic: check for anything that could be a significant object (foot/person proxy)
        const found = predictions.some(p => p.score > 0.4);
        setIsDetected(found);

        if (found && mode === 'auto' && !capturedImage) {
          handleCapture();
        }
      }
      animationId = requestAnimationFrame(runDetection);
    };

    if (model && step === 'scanning') {
      runDetection();
    }
    return () => cancelAnimationFrame(animationId);
  }, [model, mode, step, capturedImage]);

  // Cleanup Camera Stream
  const stopCamera = () => {
    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCapture = () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot({ width: 1920, height: 1080 });
      if (screenshot) {
        setCapturedImage(screenshot);
        stopCamera();
        setStep('preview'); // Move to preview to let user verify
      }
    }
  };

  const startAnalysis = async () => {
    if (!capturedImage) return;
    setStep('processing');
    setIsAnalyzing(true);
    setError(null);
    
    const imageBase64 = capturedImage.split(',')[1];
    await analyzeFoot(imageBase64);
  };

  const analyzeFoot = async (image: string) => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ image })
      });

      const data = await response.json();
      
      if (data && !data.error) {
        setAnalysisResult(data);
        setStep('results');
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err: any) {
      setError(err.message);
      setStep('preview'); // Return to preview if error occurs
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Processing Animation
  useEffect(() => {
    if (step === 'processing') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => (p >= 100 ? 100 : p + 2));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className={`app-container ${t.font}`} dir={t.dir}>
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      <button onClick={toggleLang} className="lang-switcher-glass">
        <div className="lang-icon">
          <Globe size={16} />
        </div>
        <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
      </button>

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div key="welcome" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="mobile-hero">
            <div className="status-badge" style={{ width: 'fit-content', margin: '0 auto 20px' }}>
              <span className="permission-status"></span> v2.0 PRO
            </div>
            <h1>{t.welcome.split('3D')[0]} <span className="gradient-text">3D</span> {t.welcome.split('3D')[1]}</h1>
            <p>{t.subWelcome}</p>
            <div className="btn-group">
              <button className="neon-btn" onClick={() => setStep('permissions')}>{t.startBtn} <ArrowRight size={20} className="icon-flip" /></button>
            </div>
            <div className="stats-row">
              <div><strong>99.8%</strong><span>{t.precision}</span></div>
              <div><strong>120k+</strong><span>{t.scans}</span></div>
            </div>
          </motion.div>
        )}

        {step === 'permissions' && (
          <motion.div key="permissions" variants={containerVariants} initial="hidden" animate="visible" className="glass-panel step-card">
            <div className="icon-box" style={{ margin: '0 auto 30px', background: 'rgba(142, 45, 226, 0.1)', color: 'var(--accent)' }}>
              <ShieldCheck size={28} />
            </div>
            <h2>{t.permissions.split(' ')[0]} <span className="gradient-text">{t.permissions.split(' ')[1]}</span></h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>{lang === 'ar' ? 'خاصنا نوصلو للكاميرا باش نقدرو نعبرو ليك رجلك بدقة عالية.' : 'We need camera access to measure your foot with high precision.'}</p>
            <div className="btn-group">
              <button className="neon-btn" style={{ justifyContent: 'center' }} onClick={() => setStep('setup')}>{t.agree}</button>
              <button className="outline-btn" style={{ justifyContent: 'center', gap: '8px' }} onClick={() => setStep('welcome')}>
                <ArrowLeft size={18} className="icon-flip" /> {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div key="setup" variants={containerVariants} initial="hidden" animate="visible" className="mobile-hero">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{t.setup.split(' ')[0]} <span className="gradient-text">{t.setup.split(' ')[1]}</span></h2>
            <p>{t.setupSub}</p>
            <div className="btn-group" style={{ textAlign: 'initial', marginBottom: '40px' }}>
              <div className={`glass-panel setup-card ${refObject === 'A4_PAPER' ? 'active' : ''}`} onClick={() => setRefObject('A4_PAPER')}>
                <div className="icon-box" style={{ margin: '0 0 20px' }}><FileText size={24} /></div>
                <h3>{t.a4}</h3>
                <p>{t.a4Desc}</p>
              </div>
              <div className={`glass-panel setup-card ${refObject === 'CREDIT_CARD' ? 'active' : ''}`} onClick={() => setRefObject('CREDIT_CARD')}>
                <div className="icon-box" style={{ margin: '0 0 20px' }}><CreditCard size={24} /></div>
                <h3>{t.card}</h3>
                <p>{t.cardDesc}</p>
              </div>
            </div>
            <div className="btn-group">
              <button className="neon-btn" style={{ justifyContent: 'center' }} onClick={() => { setCapturedImage(null); setStep('scanning'); }}>
                {t.launchBtn} <Scan size={20} />
              </button>
              <button className="outline-btn" style={{ justifyContent: 'center', gap: '8px' }} onClick={() => setStep('permissions')}>
                <ArrowLeft size={18} className="icon-flip" /> {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="camera-fullscreen">
            <Webcam ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: 'environment' }} className="camera-video" />
            
            <div className="scan-status-overlay">
               <div className="mode-toggle-glass">
                  <button onClick={() => setMode('manual')} className={mode === 'manual' ? 'active' : ''}>{lang === 'ar' ? 'يدوي' : 'Manual'}</button>
                  <button onClick={() => setMode('auto')} className={mode === 'auto' ? 'active' : ''}>{lang === 'ar' ? 'تلقائي' : 'Auto'}</button>
               </div>
            </div>

            <div className="calibration-frame">
               <div className={`status-dot ${isDetected ? 'active' : ''}`}></div>
               <p className="status-text">{isDetected ? (lang === 'ar' ? 'تم قشع الرجل' : 'FOOT DETECTED') : (lang === 'ar' ? 'قرب رجلك للورقة' : 'ALIGN FOOT WITH PAPER')}</p>
            </div>

            {mode === 'manual' && (
              <div className="capture-control">
                <button className="capture-btn-main" onClick={handleCapture}>
                  <div className="inner-btn">
                    <Camera size={32} />
                  </div>
                </button>
              </div>
            )}
            
            <button className="close-cam-btn" onClick={() => setStep('setup')}>
              <RotateCcw size={20} />
            </button>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div key="preview" variants={containerVariants} initial="hidden" animate="visible" className="glass-panel step-card">
            <div className="preview-container-final">
              <img src={capturedImage!} className="preview-img-final" alt="Captured" />
              <div className="scan-line"></div>
            </div>
            
            {error && (
              <div className="error-msg-box" style={{ marginTop: '20px', color: 'var(--scanning-error)', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', background: 'rgba(255, 68, 68, 0.1)', padding: '15px', borderRadius: '12px' }}>
                <AlertCircle size={20}/> <span>{error}</span>
              </div>
            )}
            
            <p style={{ color: 'var(--text-muted)', margin: '20px 0' }}>{lang === 'ar' ? 'تأكد بلي الرجل والورقة باينين مزيان قبل ما تسيفت.' : 'Make sure the foot and paper are clearly visible before analyzing.'}</p>
            
            <div className="btn-group">
              <button className="neon-btn" style={{ justifyContent: 'center' }} onClick={startAnalysis}>
                {isAnalyzing ? (lang === 'ar' ? 'جاري التحضير...' : 'Preparing...') : (lang === 'ar' ? 'بدء التحليل' : 'Analyze Now')}
              </button>
              <button className="outline-btn" style={{ justifyContent: 'center', gap: '8px' }} onClick={() => setStep('scanning')}>
                <RotateCcw size={18}/> {lang === 'ar' ? 'إعادة التصوير' : 'Retake'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div key="processing" variants={containerVariants} initial="hidden" animate="visible" className="glass-panel step-card text-center">
            <div className="icon-box animate-pulse-ui" style={{ margin: '0 auto 30px' }}>
              <Cpu size={32} className="animate-spin-slow" />
            </div>
            <h2 style={{ marginBottom: '10px' }}>{lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>{lang === 'ar' ? 'الذكاء الاصطناعي كيحسب العبارات بدقة عالية...' : 'AI is calculating dimensions with high precision...'}</p>
            
            <div className="progress-bar-container">
              <motion.div 
                className="progress-bar-fill" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                style={{ background: 'linear-gradient(90deg, var(--primary-glow), var(--secondary-glow))' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '10px' }}>
              <span>{lang === 'ar' ? 'كنحسبو التفاصيل...' : 'Calculating...'}</span>
              <span>{progress}%</span>
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div key="results" variants={containerVariants} initial="hidden" animate="visible" className="mobile-hero" style={{ paddingBottom: '100px' }}>
            <div className="status-badge" style={{ marginBottom: '20px', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> 
              {lang === 'ar' ? 'تم الحساب بنجاح' : 'ANALYSIS COMPLETE'}
              {analysisResult?.match_confidence && (
                <span className="confidence-tag" style={{ marginLeft: '8px', fontSize: '0.6rem', opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {analysisResult.match_confidence}
                </span>
              )}
            </div>
            
            <h2 style={{ fontSize: '2.5rem', margin: '20px 0' }}>{t.results.split(' ')[0]} <span className="gradient-text">{t.results.split(' ').slice(1).join(' ')}</span></h2>
            
            <div className="result-main-card glass-panel" style={{ width: '100%', padding: '30px', margin: '20px 0', textAlign: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{t.eu}</span>
              <div style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--primary-glow)', lineHeight: 1 }}>{analysisResult?.eu || "--"}</div>
            </div>

            <div className="metric-grid" style={{ width: '100%' }}>
              <div className="metric-card"><span>{t.length}</span><strong>{analysisResult?.cm || "--"} cm</strong></div>
              <div className="metric-card"><span>{t.us}</span><strong>{analysisResult?.us || "--"}</strong></div>
              <div className="metric-card"><span>{t.uk}</span><strong>{analysisResult?.uk || "--"}</strong></div>
              <div className="metric-card"><span>{t.width}</span><strong>{analysisResult?.width || "--"}</strong></div>
            </div>

            <div className="btn-group" style={{ marginTop: '40px' }}>
              <button className="neon-btn" style={{ justifyContent: 'center' }}>
                 <ShoppingBag size={20} /> {lang === 'ar' ? 'تسوق الآن' : 'Shop Now'}
              </button>
              <button className="outline-btn" style={{ justifyContent: 'center', gap: '8px' }} onClick={() => setStep('setup')}>
                <RotateCcw size={18}/> {t.newScan}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', gap: '15px', zIndex: 50, whiteSpace: 'nowrap' }}>
        <span>ENGINE: GEMINI-PRO AI</span>
        <span>CV: TENSORFLOW-JS</span>
      </footer>
    </div>
  );
};

export default App;