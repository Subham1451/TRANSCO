/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Volume2, Globe, Languages, Loader2, ArrowRight, Settings, Copy, ChevronDown, Repeat, RefreshCw, Home, History, Keyboard, Send } from 'lucide-react';
import { processVoiceInput, TranslationResult, translateText } from './services/geminiService';

interface LanguageOption {
  value: string;
  label: string;
  native: string;
  tts: string;
  welcome: string;
}

interface AppTheme {
  id: string;
  name: string;
  bgColor: string;
  accentColor: string;
  secondaryAccent: string;
  glassBg: string;
  navBg: string;
  projectorGradient: string;
  textColor: string;
  textSecondary: string;
  glows: string[];
}

const THEMES: AppTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight Tech',
    bgColor: '#0A0502',
    accentColor: '#f97316',
    secondaryAccent: '#9333ea',
    glassBg: 'bg-white/[0.03]',
    navBg: 'bg-black/40',
    projectorGradient: 'from-orange-600 via-orange-700 to-red-900',
    textColor: 'text-white',
    textSecondary: 'text-white/40',
    glows: ['orange-600/10', 'purple-900/10', 'blue-900/5']
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    bgColor: '#05010a',
    accentColor: '#06b6d4',
    secondaryAccent: '#d946ef',
    glassBg: 'bg-cyan-500/[0.05]',
    navBg: 'bg-cyan-900/20',
    projectorGradient: 'from-cyan-600 via-blue-700 to-purple-900',
    textColor: 'text-cyan-50',
    textSecondary: 'text-cyan-400/60',
    glows: ['cyan-500/20', 'fuchsia-500/20', 'blue-500/10']
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    bgColor: '#020d0f',
    accentColor: '#22c55e',
    secondaryAccent: '#0ea5e9',
    glassBg: 'bg-emerald-500/[0.05]',
    navBg: 'bg-emerald-950/40',
    projectorGradient: 'from-emerald-600 via-teal-700 to-sky-900',
    textColor: 'text-emerald-50',
    textSecondary: 'text-emerald-400/60',
    glows: ['emerald-500/15', 'sky-500/15', 'teal-500/10']
  },
  {
    id: 'ghost',
    name: 'Ghost Minimal',
    bgColor: '#f8fafc',
    accentColor: '#0f172a',
    secondaryAccent: '#64748b',
    glassBg: 'bg-slate-900/[0.03]',
    navBg: 'bg-white/70',
    projectorGradient: 'from-slate-800 via-slate-900 to-black',
    textColor: 'text-slate-900',
    textSecondary: 'text-slate-400',
    glows: ['blue-200/40', 'slate-300/40', 'indigo-100/40']
  }
];

const LANGUAGES: LanguageOption[] = [
  { value: 'odia', label: 'Odia', native: 'ଓଡ଼ିଆ', tts: 'or-IN', welcome: 'ଏଠାକୁ ସ୍ୱାଗତ' },
  { value: 'hindi', label: 'Hindi', native: 'हिन्दी', tts: 'hi-IN', welcome: 'यहाँ आपका स्वागत है' },
  { value: 'english', label: 'English', native: 'English', tts: 'en-US', welcome: 'Welcome Here' },
  { value: 'malayalam', label: 'Malayalam', native: 'മലയാളം', tts: 'ml-IN', welcome: 'ഇവിടെ സ്വാഗതം' },
  { value: 'tamil', label: 'Tamil', native: 'தமிழ்', tts: 'ta-IN', welcome: 'இங்கே வரவேற்கிறோம்' },
  { value: 'kannada', label: 'Kannada', native: 'ಕನ್ನಡ', tts: 'kn-IN', welcome: 'ಇಲ್ಲಿಗೆ ಸ್ವಾಗತ' },
  { value: 'bengali', label: 'Bengali', native: 'বাংলা', tts: 'bn-IN', welcome: 'এখানে স্বাগতম' },
  { value: 'marathi', label: 'Marathi', native: 'ମରାଠୀ', tts: 'mr-IN', welcome: 'येथे आपले स्वागत आहे' },
  { value: 'telugu', label: 'Telugu', native: 'తెలుగు', tts: 'te-IN', welcome: 'ఇక్కడికి స్వాగతం' },
  { value: 'chinese', label: 'Mandarin Chinese', native: '中文', tts: 'zh-CN', welcome: '欢迎来到这里' },
  { value: 'cantonese', label: 'Cantonese', native: '廣東話', tts: 'zh-HK', welcome: '歡迎嚟到呢度' },
  { value: 'spanish', label: 'Spanish', native: 'Español', tts: 'es-ES', welcome: 'Bienvenido aquí' },
  { value: 'french', label: 'French', native: 'Français', tts: 'fr-FR', welcome: 'Bienvenue ici' },
  { value: 'arabic', label: 'Arabic', native: 'العربية', tts: 'ar-SA', welcome: 'أهلاً بك هنا' },
  { value: 'russian', label: 'Russian', native: 'Русский', tts: 'ru-RU', welcome: 'Добро пожаловать сюда' },
  { value: 'portuguese', label: 'Portuguese', native: 'Português', tts: 'pt-PT', welcome: 'Bem-vindo aqui' },
  { value: 'urdu', label: 'Urdu', native: 'اردو', tts: 'ur-PK', welcome: 'یہاں خوش آمدید' },
  { value: 'indonesian', label: 'Indonesian', native: 'Bahasa Indonesia', tts: 'id-ID', welcome: 'Selamat datang di sini' },
  { value: 'german', label: 'German', native: 'Deutsch', tts: 'de-DE', welcome: 'Willkommen hier' },
  { value: 'japanese', label: 'Japanese', native: '日本語', tts: 'ja-JP', welcome: 'ここへようこそ' },
  { value: 'pidgin', label: 'Nigerian Pidgin', native: 'Pidgin', tts: 'pcm-NG', welcome: 'Welcome for here' },
  { value: 'turkish', label: 'Turkish', native: 'Türkçe', tts: 'tr-TR', welcome: 'Buraya hoş geldiniz' },
  { value: 'vietnamese', label: 'Vietnamese', native: 'Tiếng Việt', tts: 'vi-VN', welcome: 'Chào mừng bạn đến đây' },
];

function MultilingualBackground({ theme }: { theme: AppTheme }) {
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-1000`} style={{ backgroundColor: theme.bgColor }}>
      {/* Ambient Glows */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-${theme.glows[0]} blur-[120px] rounded-full animate-pulse`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-${theme.glows[1]} blur-[120px] rounded-full animate-pulse [animation-delay:2s]`} />
      <div className={`absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-${theme.glows[2]} blur-[100px] rounded-full`} />

      {/* Floating Multilingual Text */}
      <div className="relative w-full h-full opacity-20 select-none">
        {[...Array(20)].map((_, i) => {
          const lang = LANGUAGES[i % LANGUAGES.length];
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          const duration = 20 + Math.random() * 30;
          const delay = -Math.random() * 20;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.2, 0.5, 0.2],
                y: [0, -150, 0],
                x: [0, 80, 0],
                rotate: [-5, 5, -5]
              }}
              transition={{ 
                duration,
                repeat: Infinity,
                delay,
                ease: "linear"
              }}
              style={{ 
                position: 'absolute',
                top: `${top}%`,
                left: `${left}%`,
              }}
              className="flex flex-col items-center transform-gpu whitespace-nowrap"
            >
              <span className={`text-[14px] font-black tracking-tighter ${theme.id === 'ghost' ? 'text-slate-900/30' : 'text-white/30'}`}>{lang.native}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: theme.accentColor, opacity: 0.2 }}>{lang.welcome}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<AppTheme>(THEMES[0]);
  const [showThemeHub, setShowThemeHub] = useState(false);
  const [activeTab, setActiveTab] = useState<'translate' | 'history'>('translate');
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('odia');
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [history, setHistory] = useState<(TranslationResult & { timestamp: number, targetLang: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (result && !processing) {
      handleRetranslate();
    }
  }, [targetLang]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const swapLanguages = () => {
    if (sourceLang !== 'auto') {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }
  };

  const handleManualTranslate = async () => {
    if (!inputText.trim()) return;
    setProcessing(true);
    setResult(null);
    try {
      const targetOption = LANGUAGES.find(l => l.value === targetLang)!;
      const translationTextResponse = await translateText(inputText, targetOption.label);
      const translationResult: TranslationResult = {
        transcription: inputText,
        translation: translationTextResponse,
        identifiedLanguage: sourceLang === 'auto' ? 'Detected' : LANGUAGES.find(l => l.value === sourceLang)?.label || 'Unknown'
      };
      setResult(translationResult);
      setHistory(prev => [{ ...translationResult, timestamp: Date.now(), targetLang: targetOption.label }, ...prev]);
      setInputText(''); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const base64Audio = await blobToBase64(audioBlob);
        handleProcessAudio(base64Audio, 'audio/webm');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Please allow microphone access to use this app.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleProcessAudio = async (base64: string, mimeType: string) => {
    setProcessing(true);
    setResult(null);
    try {
      const targetOption = LANGUAGES.find(l => l.value === targetLang)!;
      const translation = await processVoiceInput(base64, mimeType, targetOption.label);
      setResult(translation);
      setHistory(prev => [{ ...translation, timestamp: Date.now(), targetLang: targetOption.label }, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRetranslate = async () => {
    if (!result) return;
    setProcessing(true);
    try {
      const targetOption = LANGUAGES.find(l => l.value === targetLang)!;
      const newTranslation = await translateText(result.transcription, targetOption.label);
      const updatedResult = {
        ...result,
        translation: newTranslation
      };
      setResult(updatedResult);
      setHistory(prev => [{ ...updatedResult, timestamp: Date.now(), targetLang: targetOption.label }, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const speak = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`flex flex-col min-h-screen ${theme.textColor} selection:bg-orange-600 selection:text-white pb-28 sm:pb-0 relative overflow-x-hidden`} style={{ backgroundColor: theme.bgColor }}>
      <MultilingualBackground theme={theme} />
      
      {/* Dynamic Navigation Bar */}
      <nav className={`${theme.navBg} border-b border-white/5 px-8 py-5 flex justify-between items-center sticky top-0 z-50 backdrop-blur-2xl transition-colors duration-1000`}>
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-2xl text-white shadow-2xl rotate-3" style={{ background: `linear-gradient(to bottom right, ${theme.accentColor}, ${theme.secondaryAccent})` }}>
            <Languages size={20} strokeWidth={2.5} />
          </div>
          <span className={`text-2xl font-black tracking-[-0.07em] uppercase italic ${theme.textColor}`}>
            JUST TRANSLATE
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setShowThemeHub(true)}
            className={`p-2.5 rounded-full transition-all border border-transparent hover:border-white/10 ${theme.id === 'ghost' ? 'text-slate-400 hover:bg-slate-200' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>
            <Settings size={20} strokeWidth={2.5} />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center p-6 sm:p-12 gap-10 relative z-10 w-full overflow-y-auto">
        
        {activeTab === 'translate' && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl flex flex-col items-center gap-10"
          >
            {/* Language Selector Rail */}
            <div className={`w-full ${theme.glassBg} p-5 rounded-[3rem] shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-6 backdrop-blur-3xl`}>
              <div className="flex-1 w-full relative group">
                <select 
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className={`w-full appearance-none bg-white/[0.02] p-5 pr-12 rounded-3xl font-black focus:outline-none focus:ring-2 transition-all cursor-pointer text-sm border border-white/5 group-hover:border-white/10 ${theme.id === 'ghost' ? 'text-slate-700' : 'text-white/70'}`}
                  style={{ ringColor: `${theme.accentColor}80` }}
                >
                  <option value="auto" className="bg-[#0a0a0a]">Detecting...</option>
                  {LANGUAGES.map(l => <option key={l.value} value={l.value} className="bg-[#0a0a0a]">{l.label}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" size={16} strokeWidth={3} style={{ color: theme.accentColor }} />
              </div>

              <motion.button 
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                disabled={sourceLang === 'auto'}
                onClick={swapLanguages}
                className={`p-4 rounded-full transition-all border ${sourceLang === 'auto' ? 'text-white/5 border-transparent' : 'border-white/10 hover:bg-white/5 active:scale-90 shadow-lg'}`}
                style={{ color: theme.accentColor, boxShadow: `0 10px 15px ${theme.accentColor}10` }}
              >
                <Repeat size={20} strokeWidth={2.5} className="rotate-90 sm:rotate-0" />
              </motion.button>

              <div className="flex-1 w-full relative group">
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className={`w-full appearance-none bg-white/[0.02] p-5 pr-12 rounded-3xl font-black focus:outline-none focus:ring-2 transition-all cursor-pointer text-sm border border-white/5 group-hover:border-white/10 ${theme.id === 'ghost' ? 'text-slate-700' : 'text-white/70'}`}
                  style={{ ringColor: `${theme.accentColor}80` }}
                >
                  {LANGUAGES.map(l => <option key={l.value} value={l.value} className="bg-[#0a0a0a]">{l.label}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" size={16} strokeWidth={3} style={{ color: theme.accentColor }} />
              </div>
            </div>

            {/* Main Stage */}
            <div className="w-full flex flex-col gap-10 items-stretch">
              
              {/* Input Control Hub */}
              <div className={`${theme.glassBg} backdrop-blur-[60px] p-12 rounded-[4rem] shadow-2xl border border-white/10 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-1000 group`}>
                <div className="absolute top-10 left-12 flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full shadow-2xl animate-pulse" style={{ backgroundColor: theme.accentColor, boxShadow: `0 0 15px ${theme.accentColor}` }} />
                  <span className={`text-[12px] font-black uppercase tracking-[0.4em] leading-none ${theme.textSecondary}`}>Sensor Interface</span>
                </div>

                <AnimatePresence mode="wait">
                  {processing ? (
                    <motion.div 
                      key="processing"
                      initial={{ opacity: 0, filter: 'blur(20px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, filter: 'blur(20px)' }}
                      className="flex flex-col items-center gap-8"
                    >
                      <Loader2 size={80} className="animate-spin" style={{ color: theme.accentColor }} />
                      <p className={`text-xs font-black tracking-[0.3em] uppercase animate-pulse ${theme.textSecondary}`}>Linguistic Analysis...</p>
                    </motion.div>
                  ) : result ? (
                    <motion.div 
                      key="result-view"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full flex flex-col items-center gap-12"
                    >
                      <div className="w-full px-8 text-center space-y-8">
                        <p className={`text-3xl sm:text-5xl font-light leading-[1.15] tracking-tight italic opacity-90 max-w-3xl mx-auto ${theme.textColor}`}>
                          "{result.transcription}"
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 items-center pt-4">
                          <div className={`inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-[0.2em]`} style={{ color: theme.accentColor }}>
                            <Globe size={13} strokeWidth={2.5} /> {result.identifiedLanguage}
                          </div>
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setResult(null)}
                            className="inline-flex items-center gap-3 px-6 py-2 rounded-full text-[11px] font-black text-white uppercase tracking-[0.2em] transition-all shadow-2xl"
                            style={{ backgroundColor: theme.accentColor }}
                          >
                            <Repeat size={13} strokeWidth={2.5} /> New Sentence
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="input-view"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -40 }}
                      className="flex flex-col items-center gap-16 w-full max-w-xl"
                    >
                      <div className="flex flex-col items-center gap-6">
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-700 ring-8 shadow-2xl`}
                          style={{ 
                            backgroundColor: isRecording ? '#dc2626' : theme.accentColor,
                            ringColor: isRecording ? '#dc262620' : `${theme.accentColor}20`
                          }}
                        >
                          {isRecording ? <Square size={28} fill="white" strokeWidth={0} /> : <Mic size={36} strokeWidth={2.5} />}
                        </motion.button>
                        <p className={`text-[11px] font-black uppercase tracking-[0.4em] text-center ${theme.textSecondary}`}>
                          {isRecording ? 'Capturing Frequency...' : 'Initiate Voice capture'}
                        </p>
                      </div>

                      {!isRecording && (
                        <div className="w-full flex flex-col gap-5">
                          <div className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] px-2 ${theme.textSecondary}`}>
                            <Keyboard size={14} strokeWidth={2.5} />
                            <span>Symbolic Entry</span>
                          </div>
                          <div className="relative group">
                            <input
                              type="text"
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleManualTranslate()}
                              placeholder="Input textual data..."
                              className={`w-full bg-white/[0.04] border border-white/10 p-6 pr-16 rounded-[2rem] font-medium placeholder:text-slate-500 outline-none focus:ring-1 transition-all backdrop-blur-[40px] shadow-inner text-lg ${theme.id === 'ghost' ? 'text-slate-900 bg-slate-200/50' : 'text-white'}`}
                              style={{ ringColor: `${theme.accentColor}80` }}
                            />
                            <motion.button 
                              whileHover={{ scale: 1.1, x: -2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={handleManualTranslate}
                              className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all shadow-lg ${inputText.trim() ? 'text-white shadow-xl' : theme.textSecondary + ' bg-white/5'}`}
                              style={{ backgroundColor: inputText.trim() ? theme.accentColor : undefined }}
                            >
                              <Send size={20} strokeWidth={2.5} />
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Translation Projector */}
              <AnimatePresence>
                {(result || processing) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50, filter: 'blur(20px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 50, filter: 'blur(20px)' }}
                    className={`bg-gradient-to-br ${theme.projectorGradient} p-16 rounded-[5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] text-white min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden transition-all group`}
                  >
                    <Globe size={384} className="absolute -top-24 -right-24 opacity-10 rotate-12 transition-transform group-hover:scale-125 group-hover:rotate-[20deg] duration-[2500ms]" />
                    
                    <div className="absolute top-10 left-12 flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_20px_white]" />
                      <span className="text-[12px] font-black text-white/50 uppercase tracking-[0.4em] leading-none">Output Frequency</span>
                    </div>

                    {result && (
                      <div className="w-full space-y-16 relative z-10 text-center">
                        <div className={`space-y-8 transition-all duration-1000 ${processing ? 'opacity-20 scale-90 blur-xl' : 'opacity-100'}`}>
                          <p className="text-[13px] font-bold text-white/80 uppercase tracking-[0.5em]">{LANGUAGES.find(l=>l.value===targetLang)?.label}</p>
                          <p className="text-5xl sm:text-7xl font-bold leading-[1] tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]">{result.translation}</p>
                        </div>

                        <div className="flex justify-center gap-8">
                          <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
                            whileTap={{ scale: 0.9 }}
                            disabled={processing}
                            onClick={handleRetranslate}
                            className={`w-20 h-20 bg-white/10 text-white rounded-3xl flex items-center justify-center border border-white/20 backdrop-blur-3xl transition-all ${processing ? 'opacity-50' : 'shadow-xl'}`}
                          >
                            <RefreshCw size={28} strokeWidth={2.5} className={processing ? 'animate-spin' : ''} />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.08, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                            whileTap={{ scale: 0.92 }}
                            disabled={processing}
                            onClick={() => speak(result.translation, LANGUAGES.find(l=>l.value===targetLang)?.tts || 'en-US')}
                            className={`w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl transition-all ${processing ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                            style={{ color: theme.accentColor }}
                          >
                            <Volume2 size={48} strokeWidth={2.5} />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.4)' }}
                            whileTap={{ scale: 0.9 }}
                            disabled={processing}
                            onClick={() => copyToClipboard(result.translation)}
                            className={`w-20 h-20 bg-black/30 text-white rounded-3xl flex items-center justify-center backdrop-blur-3xl transition-all border border-white/5 ${processing ? 'opacity-50' : 'shadow-xl'}`}
                          >
                            <Copy size={28} strokeWidth={2.5} />
                          </motion.button>
                        </div>

                        {!processing && (
                          <div className="pt-10 flex flex-col items-center gap-2">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Integrity Verified</span>
                            <div className="w-8 h-[1px] bg-white/20" />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl flex flex-col gap-10"
          >
            <div className="flex justify-between items-end px-10">
              <div>
                <h2 className={`text-5xl font-bold uppercase tracking-[-0.08em] italic leading-none ${theme.textColor}`}>Buffer Log</h2>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.accentColor }} />
                  <p className={`${theme.textSecondary} text-[11px] font-black uppercase tracking-[0.3em]`}>Synchronized session history</p>
                </div>
              </div>
              <button 
                onClick={() => setHistory([])} 
                className="px-6 py-2.5 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg hover:shadow-red-600/20"
              >
                Flush buffer
              </button>
            </div>
            
            {history.length === 0 ? (
              <div className={`${theme.glassBg} p-32 rounded-[4rem] border border-white/5 flex flex-col items-center gap-8 text-center backdrop-blur-3xl shadow-2xl`}>
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                  <History size={40} className={theme.textSecondary} />
                </div>
                <p className={`${theme.textSecondary} font-black uppercase tracking-[0.4em] text-sm`}>Temporal Sequence Empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {history.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    key={item.timestamp} 
                    className={`${theme.glassBg} p-10 rounded-[3.5rem] shadow-2xl border border-white/10 group hover:bg-white/[0.08] transition-all backdrop-blur-[50px] relative overflow-hidden`}
                  >
                    <div className="absolute -right-8 -top-8 w-24 h-24 blur-3xl rounded-full" style={{ backgroundColor: `${theme.accentColor}10` }} />
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black text-white px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-lg" style={{ backgroundColor: theme.accentColor }}>{item.identifiedLanguage}</span>
                        <ArrowRight size={14} strokeWidth={3} className={theme.textSecondary} />
                        <span className="text-[11px] font-black bg-white/10 px-4 py-1.5 rounded-full uppercase tracking-tighter border border-white/5" style={{ color: theme.textColor }}>{item.targetLang}</span>
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-tighter pt-1.5 ${theme.textSecondary}`}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="space-y-6 mb-12 relative z-10">
                      <p className={`text-sm font-medium italic leading-relaxed border-l-2 pl-4 opacity-50`} style={{ borderColor: `${theme.accentColor}40` }}>"{item.transcription}"</p>
                      <p className={`text-2xl font-bold tracking-tight leading-tight ${theme.textColor}`}>{item.translation}</p>
                    </div>
                    <div className="flex gap-4 relative z-10">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => speak(item.translation, LANGUAGES.find(l => l.label === item.targetLang)?.tts || 'en-US')}
                        className={`flex-1 py-4 text-white rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em]`}
                        style={{ backgroundColor: theme.accentColor }}
                      >
                        <Volume2 size={16} strokeWidth={2.5} /> Play Audio
                      </motion.button>
                      <button 
                        onClick={() => copyToClipboard(item.translation)}
                        className={`p-4 bg-white/5 rounded-[1.5rem] hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 ${theme.textSecondary}`}
                      >
                        <Copy size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Cyber-Navigation System */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-[80px] border border-white/10 rounded-[3rem] flex items-center px-4 py-2.5 gap-2 z-50 shadow-[0_30px_100px_rgba(0,0,0,0.9)] scale-110 sm:scale-100">
        <button 
          onClick={() => setActiveTab('translate')}
          className={`flex items-center gap-3 px-8 py-3.5 rounded-[2rem] transition-all group ${activeTab === 'translate' ? 'text-white shadow-2xl shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}
          style={{ background: activeTab === 'translate' ? `linear-gradient(to right, ${theme.accentColor}, ${theme.secondaryAccent})` : undefined }}
        >
          <Languages size={20} strokeWidth={activeTab === 'translate' ? 3 : 2} className={activeTab === 'translate' ? 'rotate-0' : 'group-hover:rotate-12 transition-transform'} />
          <span className="text-[12px] font-black uppercase tracking-[0.25em]">Process</span>
        </button>
        <div className="w-[1px] h-6 bg-white/10" />
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-3 px-8 py-3.5 rounded-[2rem] transition-all group ${activeTab === 'history' ? 'text-white shadow-2xl shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}
          style={{ background: activeTab === 'history' ? `linear-gradient(to right, ${theme.accentColor}, ${theme.secondaryAccent})` : undefined }}
        >
          <History size={20} strokeWidth={activeTab === 'history' ? 3 : 2} className={activeTab === 'history' ? 'rotate-0' : 'group-hover:scale-110 transition-transform'} />
          <span className="text-[12px] font-black uppercase tracking-[0.25em]">Buffer</span>
        </button>
      </div>

      {/* Interface Options Hub */}
      <AnimatePresence>
        {showThemeHub && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#050505] w-full max-w-4xl rounded-[4rem] border border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,1)]"
            >
              <div className="p-12 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-4xl font-black text-white italic tracking-tight italic uppercase">Interface Core</h2>
                  <p className="text-white/40 text-xs font-bold tracking-[0.3em] mt-2 uppercase">Switch system aesthetics</p>
                </div>
                <button 
                  onClick={() => setShowThemeHub(false)}
                  className="p-4 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <RefreshCw size={24} className="rotate-45" />
                </button>
              </div>

              <div className="p-12 grid grid-cols-1 sm:grid-cols-2 gap-8">
                {THEMES.map((t) => (
                  <motion.button
                    key={t.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setTheme(t);
                      setShowThemeHub(false);
                    }}
                    className={`group relative h-48 rounded-[2.5rem] border transition-all overflow-hidden text-left p-8 flex flex-col justify-end ${theme.id === t.id ? 'border-white/40 ring-4 ring-white/10 shadow-2xl shadow-white/5' : 'border-white/5 hover:border-white/20'}`}
                    style={{ backgroundColor: t.bgColor }}
                  >
                    {/* Theme Preview Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-30 rounded-full" style={{ backgroundColor: t.accentColor }} />
                    <div className="absolute bottom-0 left-0 w-24 h-24 blur-3xl opacity-20 rounded-full" style={{ backgroundColor: t.secondaryAccent }} />
                    
                    <div className="relative z-10">
                      <div className="w-8 h-1 bg-white/20 rounded-full mb-4 group-hover:w-12 transition-all duration-500" style={{ backgroundColor: t.accentColor }} />
                      <h3 className="text-2xl font-black text-white italic">{t.name}</h3>
                      <div className="flex gap-2 mt-4">
                        <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: t.accentColor }} />
                        <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: t.secondaryAccent }} />
                      </div>
                    </div>

                    {theme.id === t.id && (
                      <div className="absolute top-6 right-8 bg-white text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Active</div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="bg-white/[0.02] p-8 text-center border-t border-white/5">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em]">Neural Theme Engine v4.0</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="bg-black border-t border-white/5 py-12 px-16 hidden sm:flex justify-between items-center text-[11px] font-black uppercase tracking-[0.5em] text-white/20">
        <div className="flex gap-16">
          <span className="flex items-center gap-4" style={{ color: theme.accentColor }}><Globe size={16} strokeWidth={2.5} className="animate-pulse" /> NEURAL TRANSLATION GRID STABLE</span>
        </div>
        <div className={`italic tracking-normal normal-case opacity-40 font-semibold text-sm ${theme.textColor}`}>Breaking linguistic barriers through artificial intelligence.</div>
      </footer>
    </div>
  );
}
