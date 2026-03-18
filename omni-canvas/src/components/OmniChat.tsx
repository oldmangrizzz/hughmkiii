// omni-canvas/src/components/OmniChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useVoiceToCanvas } from '../hooks/useVoiceToCanvas';

/**
 * OmniChat: The linear dialogue layer for H.U.G.H.
 *
 * Harbor Master Philosophy: The perimeter must always be communicative.
 * OmniChat isn't just a text box; it's the primary interface through which
 * the operator and the system co-inhabit the substrate. We ensure
 * useVoiceToCanvas is integrated properly because silence is a failure
 * of Grizzly Medicine.
 *
 * Every message, every voice pulse, is captured and reasoned over to
 * ensure that the H.U.G.H. Harbor is always secure and the operator
 * is never blind.
 */
// Speak text via Web Speech Synthesis — picks the best available English voice.
// Strips <think>...</think> blocks from model output before speaking.
function speakText(text: string): void {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // cancel any in-progress speech

  const clean = text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/TOOL_CALL:[\s\S]*?(?=\n\n|$)/g, '')
    .trim();
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.92;
  utterance.pitch = 0.88;
  utterance.volume = 1.0;

  // Pick a deep English male voice if available — closest to Highland Grit
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    /en[-_](GB|AU|IE|ZA)/i.test(v.lang) && /male|daniel|george|rory|oliver/i.test(v.name)
  ) ?? voices.find(v => /en/i.test(v.lang)) ?? null;
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
}

export const OmniChat: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const messages = useQuery(api.messages.getRecent);
  const sendMessage = useMutation(api.messages.send);
  const { isRecording, startRecording, stopRecording } = useVoiceToCanvas();
  const lastPlayedId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-speak new assistant messages via Web Speech Synthesis.
  // If audioData (LFM TTS base64) is present, prefer that.
  // Otherwise fall through to SpeechSynthesis — always works, no endpoint needed.
  useEffect(() => {
    if (!messages) return;
    const latest = messages
      .slice()
      .reverse()
      .find((m: any) => m.role === 'assistant');
    if (!latest || latest._id === lastPlayedId.current) return;
    lastPlayedId.current = latest._id;

    // Try base64 audio first (LFM TTS — will work if tunnel ever exposes /audio/speech)
    if (latest.audioData) {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${latest.audioData}`);
        audio.play().catch(() => speakText(latest.content));
        return;
      } catch {
        // fall through to synthesis
      }
    }

    speakText(latest.content);
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage({ content: inputText, role: "user" });
    setInputText("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRecording && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        startRecording();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) stopRecording();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, startRecording, stopRecording]);

  // Messages come back desc — reverse for display so newest is at bottom
  const ordered = messages ? [...messages].reverse() : [];

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      width: '350px',
      height: '500px',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      overflow: 'hidden',
      color: '#fff',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{ padding: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', letterSpacing: '2px' }}>H.U.G.H.</span>
        <span style={{ fontSize: '11px', color: isRecording ? '#ff4444' : '#44ff44', letterSpacing: '1px' }}>
          {isRecording ? '● LISTENING' : '○ STANDBY'}
        </span>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ordered.map((msg: any) => (
          <div key={msg._id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: msg.role === 'user' ? 'rgba(0, 100, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              maxWidth: '80%',
              fontSize: '13px',
              lineHeight: '1.4',
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {msg.content}
              {msg.role === 'assistant' && msg.audioData && (
                <span style={{ fontSize: '10px', opacity: 0.5 }}>🔊</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px', display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type or hold [SPACE] to speak..."
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            padding: '8px',
            color: '#fff',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button onClick={handleSend} style={{
          background: '#0066ff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '0 14px',
          cursor: 'pointer',
          fontWeight: 'bold',
          letterSpacing: '1px',
          fontSize: '12px'
        }}>SEND</button>
      </div>
    </div>
  );
};
