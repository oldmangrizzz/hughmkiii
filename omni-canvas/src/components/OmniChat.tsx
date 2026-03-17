// omni-canvas/src/components/OmniChat.tsx
import React, { useState, useEffect } from 'react';
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
export const OmniChat: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const messages = useQuery(api.messages.getRecent); // Assumes this query exists or needs to be added
  const sendMessage = useMutation(api.messages.send);
  const { isRecording, startRecording, stopRecording } = useVoiceToCanvas();

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage({ content: inputText, role: "user" });
    setInputText("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRecording && (document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        startRecording();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className="omni-chat-container" style={{
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
      <div style={{ padding: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 'bold', letterSpacing: '2px' }}>H.U.G.H. CHAT</span>
        <span style={{ color: isRecording ? '#ff4444' : '#44ff44' }}>
          {isRecording ? '● LISTENING' : '○ STANDBY'}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
        {messages?.map((msg: any) => (
          <div key={msg._id} style={{ 
            marginBottom: '10px', 
            textAlign: msg.role === 'user' ? 'right' : 'left',
            opacity: 0.9
          }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '8px',
              background: msg.role === 'user' ? 'rgba(0, 100, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              maxWidth: '80%'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '15px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type or hold [SPACE]..."
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            color: '#fff'
          }}
        />
        <button onClick={handleSend} style={{
          background: '#0066ff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '0 15px',
          cursor: 'pointer'
        }}>SEND</button>
      </div>
    </div>
  );
};
