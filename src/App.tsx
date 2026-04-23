/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Volume2, Globe, Languages, Loader2, ArrowRight, Settings, Copy, ChevronDown, Repeat, RefreshCw, Home, History } from 'lucide-react';
import { processVoiceInput, TranslationResult, translateText } from './services/geminiService';

interface LanguageOption {
  value: string;
  label: string;
  native: string;
  tts: string;
  welcome: string;
}

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

function MultilingualBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.15] select-none flex flex-wrap content-start justify-center p-4 gap-x-8 gap-y-6">
      {[...Array(8)].map((_, groupIdx) => 
        LANGUAGES.map((lang, i) => (
          <div key={`${groupIdx}-${i}`} className="flex flex-col items-center rotate-[-5deg] shrink-0 transform-gpu">
            <span className="text-[12px] font-black text-gray-900 leading-none">{lang.native}</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter text-orange-700 leading-none mt-0.5">{lang.welcome}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'translate' | 'history'>('translate');
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('odia');
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [history, setHistory] = useState<(TranslationResult & { timestamp: number, targetLang: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

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

  const currentTargetOption = LANGUAGES.find(l => l.value === targetLang)!;

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] font-sans text-gray-900 selection:bg-orange-500 selection:text-white pb-24 sm:pb-0 relative overflow-x-hidden">
      <MultilingualBackground />
      
      {/* Header Navigation - Optimized for Mobile */}
      <nav className="bg-white/80 border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm backdrop-blur-md relative">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-1.5 rounded-lg text-white shadow-md">
            <Mic size={20} />
          </div>
          <span className="text-lg font-black tracking-tighter text-orange-600 uppercase">
            JUST TRANSLATE
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <button className="p-2 rounded-full text-gray-400 hover:bg-gray-100">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center p-4 sm:p-10 gap-6 bg-gradient-to-b from-white/50 to-orange-50/20 relative z-10">
        
        {activeTab === 'translate' && (
          <>
            {/* Language Selection Toolbar - Sticky on Mobile */}
            <div className="w-full max-w-3xl bg-white p-3 rounded-3xl shadow-xl border border-orange-100 flex flex-col sm:flex-row items-center gap-2 sticky top-20 z-40">
              <div className="flex-1 w-full relative">
                <select 
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full appearance-none bg-orange-50/50 p-3.5 pr-10 rounded-2xl font-black text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer text-sm"
                >
                  <option value="auto">Detecting...</option>
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-600 pointer-events-none" size={16} />
              </div>

              <button 
                disabled={sourceLang === 'auto'}
                onClick={swapLanguages}
                className={`p-2 rounded-full transition-colors ${sourceLang === 'auto' ? 'text-gray-200' : 'text-orange-600 hover:bg-orange-100'}`}
              >
                <Repeat size={18} className="rotate-90 sm:rotate-0" />
              </button>

              <div className="flex-1 w-full relative">
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full appearance-none bg-orange-50/50 p-3.5 pr-10 rounded-2xl font-black text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer text-sm"
                >
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-600 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Dynamic Mobile View: Only show one at a time or stacked */}
            <div className="w-full max-w-6xl flex flex-col gap-6 items-stretch">
              
              {/* Transcription Area */}
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[2rem] shadow-md border border-orange-100 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500">
                <div className="absolute top-4 left-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Voice Input</span>
                </div>

                <AnimatePresence mode="wait">
                  {!result && !processing && (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-32 h-32 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 ring-4 ${isRecording ? 'bg-red-500 ring-red-100 animate-pulse' : 'bg-orange-500 ring-orange-50'}`}
                      >
                        {isRecording ? <Square size={40} fill="white" /> : <Mic size={48} />}
                      </motion.button>
                      <p className="text-lg font-bold text-gray-500">
                        {isRecording ? 'Listening...' : 'Tap to Start'}
                      </p>
                    </motion.div>
                  )}

                  {processing && (
                    <motion.div 
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                      <p className="text-sm font-black text-gray-400 tracking-widest uppercase">Thinking...</p>
                    </motion.div>
                  )}

                  {result && !processing && (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full px-4 text-center space-y-4"
                    >
                      <p className="text-xl sm:text-2xl font-medium text-gray-800 leading-tight">"{result.transcription}"</p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-[10px] font-black text-orange-600 uppercase tracking-wider">
                        <Globe size={12} /> {result.identifiedLanguage}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Translation Area */}
              <AnimatePresence>
                {(result || processing) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-orange-600 p-8 rounded-[2.5rem] shadow-xl text-white min-h-[350px] flex flex-col items-center justify-center relative overflow-hidden transition-all"
                  >
                    <Globe className="absolute -top-16 -right-16 opacity-5 w-64 h-64" />
                    
                    <div className="absolute top-6 left-8 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-200 rounded-full" />
                      <span className="text-[10px] font-black text-orange-200 uppercase tracking-widest leading-none">Translation</span>
                    </div>

                    {result && !processing && (
                      <div className="w-full space-y-8 relative z-10 text-center">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-orange-200 uppercase tracking-[0.2em]">{currentTargetOption.label}</p>
                          <p className="text-3xl font-black leading-tight tracking-tight">{result.translation}</p>
                        </div>

                        <div className="flex justify-center gap-5">
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={handleRetranslate}
                            className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center border border-white/20"
                          >
                            <RefreshCw size={24} />
                          </motion.button>
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => speak(result.translation, currentTargetOption.tts)}
                            className="w-20 h-20 bg-white text-orange-600 rounded-full flex items-center justify-center shadow-lg"
                          >
                            <Volume2 size={40} />
                          </motion.button>
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => copyToClipboard(result.translation)}
                            className="w-14 h-14 bg-orange-700/50 text-white rounded-full flex items-center justify-center"
                          >
                            <Copy size={24} />
                          </motion.button>
                        </div>

                        <button 
                          onClick={() => setResult(null)}
                          className="text-[10px] font-black text-orange-200 uppercase tracking-widest pt-4 opacity-60"
                        >
                          CLEAR & NEXT
                        </button>
                      </div>
                    )}

                    {processing && !result && (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="font-black text-sm tracking-widest">TRANSLATING...</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl flex flex-col gap-4"
          >
            <div className="flex justify-between items-center px-4">
              <h2 className="text-2xl font-black text-orange-600 uppercase tracking-tighter">Translation History</h2>
              <button onClick={() => setHistory([])} className="text-xs font-black text-gray-400 uppercase hover:text-red-500">Clear All</button>
            </div>
            
            {history.length === 0 ? (
              <div className="bg-white/80 p-12 rounded-[2rem] border border-orange-100 flex flex-col items-center gap-4 text-center">
                <History className="w-12 h-12 text-gray-200" />
                <p className="text-gray-400 font-bold">No translations yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.timestamp} 
                    className="bg-white p-6 rounded-[2rem] shadow-sm border border-orange-100 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">{item.identifiedLanguage}</span>
                        <ArrowRight size={12} className="text-gray-300" />
                        <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase">{item.targetLang}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-300">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 font-medium italic">"{item.transcription}"</p>
                      <p className="text-lg font-black text-gray-800 tracking-tight leading-tight">{item.translation}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const opt = LANGUAGES.find(l => l.label === item.targetLang);
                          speak(item.translation, opt?.tts || 'en-US');
                        }}
                        className="p-2 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
                      >
                        <Volume2 size={16} />
                      </button>
                      <button 
                        onClick={() => copyToClipboard(item.translation)}
                        className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Persistent Bottom App Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center px-4 py-3 sm:hidden z-50 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => setActiveTab('translate')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'translate' ? 'text-orange-500 scale-110' : 'text-gray-400'}`}
        >
          <Home size={22} strokeWidth={activeTab === 'translate' ? 3 : 2} />
          <span className="text-[10px] font-bold">Translate</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'history' ? 'text-orange-500 scale-110' : 'text-gray-400'}`}
        >
          <History size={22} strokeWidth={activeTab === 'history' ? 3 : 2} />
          <span className="text-[10px] font-bold">History</span>
        </button>
      </div>

      <footer className="bg-white border-t border-gray-100 py-6 px-10 hidden sm:flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-gray-400">
        <div className="flex gap-8">
          <span className="flex items-center gap-2 text-orange-600"><Globe size={14} /> Global Link Ready</span>
        </div>
        <div className="italic tracking-normal normal-case opacity-50">Empowering clear communication.</div>
      </footer>
    </div>
  );
}
