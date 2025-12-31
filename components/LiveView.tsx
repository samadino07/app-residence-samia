
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData, encodeAudio } from '../services/geminiService';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [status, setStatus] = useState('Le mode vocal est inactif');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current = null;
    if (audioContextRef.current) audioContextRef.current.close();
    if (outAudioContextRef.current) outAudioContextRef.current.close();
    setIsActive(false);
    setStatus('Mode vocal arrêté');
  };

  const startSession = async () => {
    try {
      setStatus('Connexion à Aura Live...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'Vous êtes Aura, un assistant vocal amical et concis. Gardez vos réponses naturelles et brèves.',
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('Aura est à l\'écoute...');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsAiSpeaking(true);
              const ctx = outAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decodeBase64(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsAiSpeaking(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => stopSession(),
          onclose: () => stopSession()
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setStatus('Erreur d\'accès au microphone');
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-6 space-y-12 bg-slate-950">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white tracking-tight">Voix en Direct</h2>
        <p className="text-slate-400 max-w-sm mx-auto">Parlez à Aura naturellement en temps réel. Une interaction fluide et instantanée.</p>
      </div>

      <div className="relative flex items-center justify-center">
        <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
          isActive ? isAiSpeaking ? 'bg-gradient-to-br from-purple-500 to-blue-600 scale-110' : 'bg-gradient-to-br from-blue-500 to-teal-400' : 'bg-slate-800'
        }`}>
          <i className={`fas ${isActive ? 'fa-microphone' : 'fa-microphone-slash'} text-5xl text-white`}></i>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
          <span className="text-sm font-medium text-slate-300">{status}</span>
        </div>
        <button onClick={isActive ? stopSession : startSession} className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center space-x-3 ${isActive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}>
          <i className={`fas ${isActive ? 'fa-stop' : 'fa-play'}`}></i>
          <span>{isActive ? 'Arrêter la discussion' : 'Commencer à parler'}</span>
        </button>
      </div>
    </div>
  );
};

export default LiveView;
