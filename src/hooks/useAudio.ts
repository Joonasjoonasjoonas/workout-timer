import { useCallback } from 'react';

interface AudioHookReturn {
  playStartBeep: () => void;
  playCountdownBeep: () => void;
}

export const useAudio = (isSoundEnabled: boolean): AudioHookReturn => {
  const getAudioContext = useCallback(() => {
    const AudioContextClass = window.AudioContext || 
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    return new AudioContextClass();
  }, []);

  const playStartBeep = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 1000;
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime + 0.39);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
      
      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
      }, 500);
    } catch (error) {
      console.error('Audio error:', error);
    }
  }, [isSoundEnabled, getAudioContext]);

  const playCountdownBeep = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 800;
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.005);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime + 0.095);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
      
      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
      }, 200);
    } catch (error) {
      console.error('Audio error:', error);
    }
  }, [isSoundEnabled]);

  return { playStartBeep, playCountdownBeep };
}; 