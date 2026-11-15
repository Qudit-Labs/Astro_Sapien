import React, { useEffect, useState } from 'react';
import { VoiceState } from '@/services/voiceAssistant';

interface VoiceWaveformVisualizerProps {
  state: VoiceState;
  barCount?: number;
}

export const VoiceWaveformVisualizer: React.FC<VoiceWaveformVisualizerProps> = ({
  state,
  barCount = 18,
}) => {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 15)
  );

  useEffect(() => {
    if (state !== 'listening' && state !== 'speaking') {
      setHeights(Array.from({ length: barCount }, () => 15));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          // Central bulge for audio frequency representation
          const centerDist = Math.abs(i - barCount / 2) / (barCount / 2);
          const base = (1 - centerDist * 0.6) * 100;
          const randomFactor = Math.random() * 45;
          return Math.max(12, Math.min(95, base * 0.6 + randomFactor));
        })
      );
    }, 90);

    return () => clearInterval(interval);
  }, [state, barCount]);

  const getBarColor = () => {
    if (state === 'listening') {
      // Alert amber/red during astronaut speaking/listening
      return 'bg-gradient-to-t from-[#FC3D21] to-[#F5B942] shadow-[0_0_8px_rgba(252,61,33,0.6)]';
    }
    if (state === 'speaking') {
      // Cyber cyan/teal during CapCom voice transmission
      return 'bg-gradient-to-t from-[#0B3D91] to-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.7)]';
    }
    return 'bg-slate-300 dark:bg-slate-700/60';
  };

  return (
    <div className="flex items-center justify-center gap-1 h-9 px-3 py-1 rounded-xl bg-slate-200/60 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-700/40 backdrop-blur-sm">
      {heights.map((h, idx) => (
        <div
          key={idx}
          className={`w-1 rounded-full transition-all duration-75 ${getBarColor()}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
};
