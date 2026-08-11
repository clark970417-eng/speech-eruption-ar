import React, { useState } from 'react';
import { generateWordList } from '../services/geminiService';
import { AppConfig } from '../types';

interface ControlPanelProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  wordList: string[];
  setWordList: React.Dispatch<React.SetStateAction<string[]>>;
  isConnected: boolean;
  toggleConnection: () => void;
  audioLevel: number;
  isFaceDetected: boolean;
  mouthOpenness: number; // New prop for visualization
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  setConfig,
  wordList,
  setWordList,
  isConnected,
  toggleConnection,
  audioLevel,
  isFaceDetected,
  mouthOpenness
}) => {
  const [prompt, setPrompt] = useState("Funny angry cartoon sounds");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const newWords = await generateWordList(prompt);
      if (newWords.length > 0) {
        setWordList(newWords);
        // Clear fixed text so user sees the new generated list effect immediately
        setConfig(prev => ({ ...prev, fixedText: "" }));
      }
    } catch (e) {
      alert("Failed to generate words. Check API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="fixed top-4 left-4 z-50 bg-gray-900/80 backdrop-blur text-white p-3 rounded-full border border-gray-700 shadow-lg hover:bg-gray-800 transition-all active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      </button>
    );
  }

  return (
    <div className={`
      fixed z-50 bg-gray-900/95 backdrop-blur-md border-gray-700 shadow-2xl overflow-hidden transition-all flex flex-col
      /* Mobile: Top Sheet */
      top-0 left-0 right-0 w-full rounded-b-2xl border-b max-h-[85vh]
      /* Desktop: Floating Sidebar */
      md:top-4 md:left-4 md:w-80 md:rounded-2xl md:border md:max-h-[90vh]
    `}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 shrink-0">
        <h1 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
          Speech Eruption
        </h1>
        <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-white p-2 -mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar text-sm font-sans pb-8 md:pb-4">
        
        {/* Main Control */}
        <div>
          <button
            onClick={toggleConnection}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${
              isConnected 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
            }`}
          >
            {isConnected ? 'Stop Camera' : 'Start Camera'}
          </button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-black/40 p-2 rounded border border-gray-700">
            <span className="text-gray-400 block mb-1">Status</span>
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
          <div className="bg-black/40 p-2 rounded border border-gray-700">
             <span className="text-gray-400 block mb-1">Face Tracking</span>
             <span className={isFaceDetected ? 'text-blue-400' : 'text-yellow-500'}>
               {isFaceDetected ? 'LOCKED' : 'SEARCHING'}
             </span>
          </div>
        </div>

        {/* Real-time Meters */}
        <div className="space-y-3">
          {/* Volume */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Mic Input</span>
              <span>{(audioLevel * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-75 ease-out"
                style={{ width: `${Math.min(audioLevel * 100 * 2, 100)}%` }}
              />
            </div>
          </div>

          {/* Mouth Openness */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Mouth Openness</span>
              <span className={mouthOpenness > config.minMouthOpenness ? "text-green-400 font-bold" : ""}>
                {(mouthOpenness * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
              {/* Threshold Marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                style={{ left: `${config.minMouthOpenness * 100 * 4}%` /* Approximate scale for visualization */ }}
              />
              <div 
                className={`h-full transition-all duration-75 ease-out ${mouthOpenness > config.minMouthOpenness ? "bg-blue-500" : "bg-blue-900"}`}
                style={{ width: `${Math.min(mouthOpenness * 100 * 4, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-700" />

        {/* Fixed Text Input */}
        <div className="space-y-2">
           <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
             <span className="text-violet-400">💬 Fixed Text (Override)</span>
           </label>
           <input
             type="text"
             value={config.fixedText}
             onChange={(e) => setConfig({ ...config, fixedText: e.target.value })}
             placeholder="Leave empty for random words"
             className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-base md:text-sm focus:border-violet-500 focus:outline-none transition-colors"
           />
           <p className="text-[10px] text-gray-500">
             If set, only this text will erupt. Leave empty to use the list below.
           </p>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">Audio Threshold</span>
              <span className="text-gray-500">{config.sensitivity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={config.sensitivity}
              onChange={(e) => setConfig({ ...config, sensitivity: parseFloat(e.target.value) })}
              className="w-full h-4 md:h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">Min Mouth Openness</span>
              <span className="text-gray-500">{config.minMouthOpenness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.5"
              step="0.01"
              value={config.minMouthOpenness}
              onChange={(e) => setConfig({ ...config, minMouthOpenness: parseFloat(e.target.value) })}
              className="w-full h-4 md:h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">Gravity</span>
              <span className="text-gray-500">{config.gravity > 0 ? 'Down' : 'Up'}</span>
            </div>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.1"
              value={config.gravity}
              onChange={(e) => setConfig({ ...config, gravity: parseFloat(e.target.value) })}
              className="w-full h-4 md:h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>
        </div>

        <hr className="border-gray-700" />

        {/* Optional word-list helper */}
        <div className="space-y-2 opacity-90">
          <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
            <span className="text-pink-400">✨ Random Word Generator</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Pirate insults"
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-2 text-base md:py-1 md:text-xs focus:border-pink-500 focus:outline-none"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-bold"
            >
              {isGenerating ? '...' : 'GEN'}
            </button>
          </div>
        </div>

        {/* Current Word List Preview */}
        <div className={`bg-black/30 rounded p-2 max-h-24 overflow-y-auto flex flex-wrap gap-1 border border-gray-800 ${config.fixedText ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
           {wordList.map((word, i) => (
             <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-700 rounded text-gray-200">
               {word}
             </span>
           ))}
        </div>

      </div>
    </div>
  );
};

export default ControlPanel;
