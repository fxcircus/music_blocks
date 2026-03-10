import React, { FC, useEffect, useState, useRef, useCallback } from "react";
import styled, { useTheme } from 'styled-components';
import { useTheme as useAppTheme, ThemeName } from '../../theme/ThemeProvider';
import { useSoundSettings } from '../../context/SoundSettingsContext';
import { motion } from 'framer-motion';
import { FaVolumeMute, FaVolumeUp, FaPlay, FaPause, FaPlus, FaMinus, FaBug } from 'react-icons/fa';
import { GiMetronome } from 'react-icons/gi';
import { Icon } from '../../utils/IconHelper';
import ToolCardDnd from '../common/ToolCardDnd';
import TipsModal from '../common/TipsModal';
import HelpButton from '../common/HelpButton';
import config from '../../config';

// Supported time signatures and their accent patterns
const TIME_SIGNATURES: Record<string, { beats: number; accents: number[] }> = {
  '2/4': { beats: 2, accents: [0] },
  '3/4': { beats: 3, accents: [0] },
  '4/4': { beats: 4, accents: [0] },
  '5/4': { beats: 5, accents: [0] },
  '6/8': { beats: 6, accents: [0] },
  '7/4': { beats: 7, accents: [0] },
};

const TIME_SIGNATURE_OPTIONS = Object.keys(TIME_SIGNATURES);

interface LoaderProps {
    bpm: number;
    timeSignature?: string;
    onRemove?: () => void;
    canRemove?: boolean;
    dragHandleProps?: any;
    isRecentlyDragged?: boolean;
}

const MetronomeDisplay = styled.div`
  width: 100%;
  position: relative;
  height: 120px;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const MetronomePendulum = styled(motion.div)<{ $useGradient?: boolean }>`
  width: 4px;
  height: 90px;
  background: ${({ theme, $useGradient }) => $useGradient ? theme.colors.accentGradient : theme.colors.primary};
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transform-origin: bottom center;
  box-shadow: ${({ theme }) => theme.shadows.small};
  cursor: pointer;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 20px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

const MetronomeBase = styled(motion.div)<{ $useGradient?: boolean }>`
  width: 200px;
  height: 25px;
  background: ${({ theme, $useGradient }) => $useGradient ? theme.colors.accentGradient : theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  position: absolute;
  bottom: 0;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  cursor: pointer;
`;

const DialDisplay = styled.div`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translate(-52%, 50%);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0;

  .bpm-input {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: 700;
    color: #fff;
    background: transparent;
    border: none;
    padding: 4px 0;
    text-align: center;
    outline: none;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    cursor: pointer;
    width: 36px;
    margin-right: 25px;
    // margin-left: 1px;
  }

  .dial-label {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 600;
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    margin: 0;
    padding: 0 2px;
  }

  .ts-button {
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: 700;
    color: #fff;
    background: transparent;
    border: none;
    padding: 4px 2px;
    text-align: center;
    outline: none;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    cursor: pointer;
    white-space: nowrap;
    position: relative;
  }
`;

const TsDropdownWrapper = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
`;

const TsDropdown = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  min-width: 180px;
`;

const TsDropdownOption = styled.button<{ $isSelected: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.xs}`};
  background: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary + '30' : theme.colors.background};
  border: 1px solid ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.border};
  color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ $isSelected }) => ($isSelected ? 600 : 400)};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  transition: background-color 0.12s, border-color 0.12s, color 0.12s;
  white-space: nowrap;
  text-align: center;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}20;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.sm};
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ControlButton = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  padding: ${({ theme }) => theme.spacing.sm};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const PlayPauseButton = styled(ControlButton)`
  font-size: ${({ theme }) => theme.fontSizes.xxxl};
`;

const BeatIndicator = styled(motion.div)`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  margin: 0 ${({ theme }) => theme.spacing.xs};
`;

const BeatsRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

const BpmControls = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 200px;
  z-index: 1;
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

// Add a debug overlay component
const DebugOverlay = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  color: lime;
  font-family: monospace;
  padding: 10px;
  border-radius: 5px;
  z-index: 9999;
  max-width: 300px;
  max-height: 300px;
  overflow: auto;
  font-size: 12px;
`;

const DebugButton = styled(motion.button)`
  position: absolute;
  top: 5px;
  right: 5px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  z-index: 10;
  font-size: 16px;
  opacity: 0.6;
  
  &:hover {
    opacity: 1;
  }
`;

// Per-theme metronome sound profiles
interface SoundProfile {
  play: (ctx: AudioContext, time: number, isAccent: boolean, volume: number) => void;
}

function createMasterGain(ctx: AudioContext, volume: number): GainNode {
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  return master;
}

const SOUND_PROFILES: Record<ThemeName, SoundProfile> = {
  // Dark — clean sine click (original)
  dark: {
    play(ctx, time, isAccent, volume) {
      const master = createMasterGain(ctx, volume);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = isAccent ? 880 : 440;
      gain.gain.value = isAccent ? 0.5 : 0.3;
      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(gain.gain.value, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.start(time);
      osc.stop(time + 0.15);
    },
  },
  // Light — same clean sine click as Dark
  light: {
    play(ctx, time, isAccent, volume) {
      const master = createMasterGain(ctx, volume);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = isAccent ? 880 : 440;
      gain.gain.value = isAccent ? 0.5 : 0.3;
      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(gain.gain.value, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.start(time);
      osc.stop(time + 0.15);
    },
  },
  // Vintage — bright woodblock knock
  vintage: {
    play(ctx, time, isAccent, volume) {
      const master = createMasterGain(ctx, volume);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = isAccent ? 1200 : 600;
      const vol = isAccent ? 0.45 : 0.28;
      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.start(time);
      osc.stop(time + 0.08);
    },
  },
  // Indie — lo-fi square-wave tape click
  indie: {
    play(ctx, time, isAccent, volume) {
      const master = createMasterGain(ctx, volume);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = isAccent ? 1000 : 500;
      const vol = isAccent ? 0.25 : 0.15;
      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      osc.start(time);
      osc.stop(time + 0.06);
    },
  },
  // Disco — finger snap
  disco: {
    play(ctx, time, isAccent, volume) {
      const master = createMasterGain(ctx, volume);
      // Noise layer — the snap body
      const sampleRate = ctx.sampleRate;
      const dur = 0.06;
      const samples = Math.floor(sampleRate * dur);
      const buffer = ctx.createBuffer(1, samples, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = isAccent ? 1800 : 1500;
      filter.Q.value = 1.5;
      const noiseGain = ctx.createGain();
      const noiseVol = isAccent ? 0.5 : 0.35;
      source.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);
      noiseGain.gain.setValueAtTime(noiseVol, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      source.start(time);
      source.stop(time + dur);
      // Tone layer — subtle pitch bend for the "click"
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent ? 1600 : 1200, time);
      osc.frequency.exponentialRampToValueAtTime(600, time + 0.03);
      const oscVol = isAccent ? 0.15 : 0.1;
      osc.connect(oscGain);
      oscGain.connect(master);
      oscGain.gain.setValueAtTime(oscVol, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      osc.start(time);
      osc.stop(time + 0.04);
    },
  },
  // Hip Hop — crisp hi-hat shimmer (filtered noise burst)
  hiphop: {
    play(ctx, time, isAccent, volume) {
      const master = createMasterGain(ctx, volume);
      const sampleRate = ctx.sampleRate;
      const duration = isAccent ? 0.08 : 0.05;
      const samples = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, samples, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = isAccent ? 8000 : 9000;
      const gain = ctx.createGain();
      const vol = isAccent ? 0.45 : 0.3;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      source.start(time);
      source.stop(time + duration);
    },
  },
};

// Metronome class
class MetronomeEngine {
  context: AudioContext | null = null;
  nextNoteTime: number = 0.0;
  scheduledNotes: { beat: number, time: number }[] = [];
  timerID: number | null = null;
  currentBeat: number = 0;
  beatsPerMeasure: number = 4;
  accentBeats: Set<number> = new Set([0]);
  tempo: number = 120;
  running: boolean = false;
  muted: boolean = false;
  volume: number = 1;
  soundProfile: SoundProfile = SOUND_PROFILES.dark;
  onBeatChange: ((beat: number) => void) | null = null;

  constructor(tempo: number, onBeatChange?: (beat: number) => void) {
    this.tempo = tempo;
    if (onBeatChange) {
      this.onBeatChange = onBeatChange;
    }
  }

  setSoundProfile(theme: ThemeName) {
    this.soundProfile = SOUND_PROFILES[theme];
  }

  setVolume(volume: number) {
    this.volume = volume;
  }
  
  init() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      return true;
    } catch (e) {
      console.error("Web Audio API not supported in this browser:", e);
      return false;
    }
  }
  
  start() {
    if (this.running) return;
    
    if (!this.context) {
      const success = this.init();
      if (!success) return;
    }
    
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
    
    this.running = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.context!.currentTime;
    this.scheduledNotes = [];
    this.scheduler();
  }
  
  stop() {
    this.running = false;
    this.clearTimer();
    this.scheduledNotes = [];
    
    // Reset beat
    this.currentBeat = 0;
    if (this.onBeatChange) {
      this.onBeatChange(this.currentBeat);
    }
  }
  
  setTempo(tempo: number) {
    this.tempo = tempo;
  }
  
  setMuted(muted: boolean) {
    this.muted = muted;
  }

  setTimeSignature(beats: number, accents: number[]) {
    this.beatsPerMeasure = beats;
    this.accentBeats = new Set(accents);
  }
  
  private clearTimer() {
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }
  
  private playNote(time: number, isAccent: boolean) {
    if (this.muted || !this.context) return;
    this.soundProfile.play(this.context, time, isAccent, this.volume);
  }
  
  private scheduler() {
    if (!this.running || !this.context) return;
    
    while (this.nextNoteTime < this.context.currentTime + 0.1) {
      this.scheduleNote(this.currentBeat, this.nextNoteTime);
      this.advanceNote();
    }
    
    this.timerID = window.setTimeout(() => this.scheduler(), 25);
  }
  
  private scheduleNote(beatNumber: number, time: number) {
    // Add note to queue for UI updates
    this.scheduledNotes.push({ beat: beatNumber, time: time });
    
    // Play the note — accent on strong beats
    this.playNote(time, this.accentBeats.has(beatNumber));
  }
  
  private advanceNote() {
    // Advance the beat
    this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
    
    // Calculate time for next beat
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += secondsPerBeat;
    
    // Update beat
    if (this.onBeatChange) {
      this.onBeatChange(this.currentBeat);
    }
  }
  
  // Process scheduled notes and update UI
  processScheduledNotes(currentTime: number): number | null {
    // Remove notes that have played and get the current beat to display
    while (
      this.scheduledNotes.length > 0 && 
      this.scheduledNotes[0].time < currentTime
    ) {
      const note = this.scheduledNotes.shift();
      if (note) {
        return note.beat;
      }
    }
    return null;
  }
  
  // Clean up resources
  cleanup() {
    this.stop();
    if (this.context) {
      this.context.close().catch(e => console.error("Error closing audio context:", e));
      this.context = null;
    }
  }
}

const Metronome: FC<LoaderProps> = ({
    bpm: initialBpm,
    timeSignature: initialTimeSignature = '4/4',
    onRemove,
    canRemove,
    dragHandleProps,
    isRecentlyDragged
}) => {
    const theme = useTheme();
    const { themeName } = useAppTheme();
    const { effectiveMetronomeTheme, metronomeVolume } = useSoundSettings();
    const useGradient = false;

    // State
    const [metronomePlaying, setMetronomePlaying] = useState(false);
    const [muteSound, setMuteSound] = useState(false);
    const [bpm, setBpm] = useState(initialBpm);
    const [currentBeat, setCurrentBeat] = useState(0);
    const [showTips, setShowTips] = useState(false);
    const [bpmInput, setBpmInput] = useState(String(initialBpm));
    const [timeSignature, setTimeSignature] = useState(initialTimeSignature);
    const [showTsDropdown, setShowTsDropdown] = useState(false);
    const tsDropdownRef = useRef<HTMLDivElement>(null);

    // Derive beats array and accent pattern from current time signature
    const tsConfig = TIME_SIGNATURES[timeSignature] || TIME_SIGNATURES['4/4'];
    const beats = Array.from({ length: tsConfig.beats }, (_, i) => i);
    
    // Refs
    const metronomeRef = useRef<MetronomeEngine | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const prevInitialBpmRef = useRef<number>(initialBpm);
    const ignoreExternalUpdatesRef = useRef<boolean>(false);
    const ignoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Debug
    const [showDebug, setShowDebug] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const logCountRef = useRef(0);
    
    // Debug logging function
    const debugLog = useCallback((message: string) => {
        const timestamp = new Date().toISOString().substr(11, 12);
        const logId = ++logCountRef.current;
        const logMessage = `[${logId}][${timestamp}] ${message}`;
        console.log(logMessage);
        
        setDebugLogs(prev => {
            const newLogs = [...prev, logMessage];
            return newLogs.slice(-20); // Keep only the last 20 logs
        });
    }, []);
    
    // Initialize the metronome engine
    useEffect(() => {
        debugLog("Initializing metronome engine");
        
        // Create metronome instance with beat change handler
        metronomeRef.current = new MetronomeEngine(
            bpm, 
            (beat) => {
                // This is called when the beat advances internally
                // We don't need to update UI here as that's done in the animation frame
            }
        );
        
        // Initialize audio context and sound profile
        metronomeRef.current.init();
        metronomeRef.current.setSoundProfile(effectiveMetronomeTheme);
        metronomeRef.current.setVolume(metronomeVolume);
        
        // Clean up on unmount
        return () => {
            debugLog("Cleaning up metronome");
            
            // Cancel animation frame
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            
            // Clear any pending timeouts
            if (ignoreTimeoutRef.current !== null) {
                clearTimeout(ignoreTimeoutRef.current);
                ignoreTimeoutRef.current = null;
            }
            
            // Clean up metronome
            if (metronomeRef.current) {
                metronomeRef.current.cleanup();
                metronomeRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps = only run once on mount
    
    // Effect for animation frame
    useEffect(() => {
        if (!metronomePlaying || !metronomeRef.current?.context) return;
        
        // Function to update UI based on scheduled notes
        const updateUI = () => {
            if (!metronomeRef.current?.context) return;
            
            const currentTime = metronomeRef.current.context.currentTime;
            const beatToShow = metronomeRef.current.processScheduledNotes(currentTime);
            
            if (beatToShow !== null) {
                setCurrentBeat(beatToShow);
            }
            
            // Continue animation if still playing
            if (metronomePlaying) {
                rafIdRef.current = requestAnimationFrame(updateUI);
            }
        };
        
        // Start animation
        rafIdRef.current = requestAnimationFrame(updateUI);
        
        // Clean up
        return () => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [metronomePlaying]);
    
    // Handle external BPM changes (from props)
    useEffect(() => {
        // Only process external BPM changes if we're not ignoring them
        if (initialBpm !== prevInitialBpmRef.current && !ignoreExternalUpdatesRef.current) {
            debugLog(`External BPM change: ${prevInitialBpmRef.current} → ${initialBpm}`);
            setBpm(initialBpm);
            prevInitialBpmRef.current = initialBpm;
            
            if (metronomeRef.current) {
                metronomeRef.current.setTempo(initialBpm);
            }
        } else if (initialBpm !== prevInitialBpmRef.current) {
            // Still update the ref even if we ignored the change
            debugLog(`Ignoring external BPM change to ${initialBpm} (local change in progress)`);
            prevInitialBpmRef.current = initialBpm;
        }
    }, [initialBpm, debugLog]);
    
    // Update BPM in metronome engine when it changes locally
    useEffect(() => {
        if (metronomeRef.current) {
            debugLog(`Updating metronome tempo to ${bpm}`);
            metronomeRef.current.setTempo(bpm);
        }
        setBpmInput(String(bpm));
    }, [bpm, debugLog]);
    
    // Update mute state in metronome engine
    useEffect(() => {
        if (metronomeRef.current) {
            debugLog(`Setting mute to ${muteSound}`);
            metronomeRef.current.setMuted(muteSound);
        }
    }, [muteSound, debugLog]);

    // Update sound profile when theme changes
    useEffect(() => {
        if (metronomeRef.current) {
            metronomeRef.current.setSoundProfile(effectiveMetronomeTheme);
        }
    }, [effectiveMetronomeTheme]);

    // Update volume when it changes
    useEffect(() => {
        if (metronomeRef.current) {
            metronomeRef.current.setVolume(metronomeVolume);
        }
    }, [metronomeVolume]);

    // Handle external time signature changes (from props)
    useEffect(() => {
        if (initialTimeSignature !== timeSignature) {
            setTimeSignature(initialTimeSignature);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialTimeSignature]);

    // Update time signature in metronome engine
    useEffect(() => {
        if (metronomeRef.current) {
            const cfg = TIME_SIGNATURES[timeSignature] || TIME_SIGNATURES['4/4'];
            debugLog(`Setting time signature to ${timeSignature}`);
            metronomeRef.current.setTimeSignature(cfg.beats, cfg.accents);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeSignature]);
    
    // Start/stop metronome when playing state changes
    useEffect(() => {
        if (!metronomeRef.current) return;
        
        if (metronomePlaying) {
            debugLog("Starting metronome");
            metronomeRef.current.start();
        } else {
            debugLog("Stopping metronome");
            metronomeRef.current.stop();
        }
    }, [metronomePlaying, debugLog]);
    
    // UI event handlers
    const handleIncreaseBpm = () => {
        const newBpm = Math.min(bpm + 1, 300);
        if (newBpm !== bpm) {
            debugLog(`Increase BPM: ${bpm} → ${newBpm}`);
            
            // Set flag to ignore external updates temporarily
            ignoreExternalUpdatesRef.current = true;
            
            // Update local state
            setBpm(newBpm);
            
            // Clear any previous timeout
            if (ignoreTimeoutRef.current) {
                clearTimeout(ignoreTimeoutRef.current);
            }
            
            // Reset the ignore flag after a delay
            ignoreTimeoutRef.current = setTimeout(() => {
                ignoreExternalUpdatesRef.current = false;
                ignoreTimeoutRef.current = null;
                debugLog(`Resumed processing external BPM changes`);
            }, 500);
        }
    };
    
    const handleDecreaseBpm = () => {
        const newBpm = Math.max(bpm - 1, 40);
        if (newBpm !== bpm) {
            debugLog(`Decrease BPM: ${bpm} → ${newBpm}`);
            
            // Set flag to ignore external updates temporarily
            ignoreExternalUpdatesRef.current = true;
            
            // Update local state
            setBpm(newBpm);
            
            // Clear any previous timeout
            if (ignoreTimeoutRef.current) {
                clearTimeout(ignoreTimeoutRef.current);
            }
            
            // Reset the ignore flag after a delay
            ignoreTimeoutRef.current = setTimeout(() => {
                ignoreExternalUpdatesRef.current = false;
                ignoreTimeoutRef.current = null;
                debugLog(`Resumed processing external BPM changes`);
            }, 500);
        }
    };
    
    const handleBpmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBpmInput(e.target.value);
    };

    const commitBpmInput = () => {
        const parsed = parseInt(bpmInput, 10);
        if (!isNaN(parsed)) {
            const clamped = Math.max(40, Math.min(300, parsed));
            debugLog(`Manual BPM input: ${bpm} → ${clamped}`);
            ignoreExternalUpdatesRef.current = true;
            setBpm(clamped);
            if (ignoreTimeoutRef.current) {
                clearTimeout(ignoreTimeoutRef.current);
            }
            ignoreTimeoutRef.current = setTimeout(() => {
                ignoreExternalUpdatesRef.current = false;
                ignoreTimeoutRef.current = null;
            }, 500);
        } else {
            setBpmInput(String(bpm));
        }
    };

    const handleBpmInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            commitBpmInput();
            (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
            setBpmInput(String(bpm));
            (e.target as HTMLInputElement).blur();
        }
    };

    const toggleMetronome = () => {
        debugLog(`Toggle metronome: ${metronomePlaying ? 'off' : 'on'}`);
        setMetronomePlaying(!metronomePlaying);
    };
    
    const toggleMute = () => {
        debugLog(`Toggle mute: ${muteSound ? 'unmute' : 'mute'}`);
        setMuteSound(!muteSound);
    };
    
    const toggleDebug = () => {
        setShowDebug(!showDebug);
    };

    const handleTsSelect = (newTs: string) => {
        debugLog(`Time signature change: ${timeSignature} → ${newTs}`);
        setTimeSignature(newTs);
        setCurrentBeat(0);
        setShowTsDropdown(false);
    };

    // Close TS dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showTsDropdown && tsDropdownRef.current && !tsDropdownRef.current.contains(event.target as Node)) {
                setShowTsDropdown(false);
            }
        };
        if (showTsDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTsDropdown]);

    return (
        <ToolCardDnd
            title="Metronome"
            icon={GiMetronome}
            onRemove={onRemove}
            canRemove={canRemove}
            dragHandleProps={dragHandleProps}
            isRecentlyDragged={isRecentlyDragged}
            additionalControls={<HelpButton onClick={() => setShowTips(true)} />}
        >
            {config.DEBUG_MODE && (
                <DebugButton onClick={toggleDebug} aria-label="Toggle debug panel">
                    <Icon icon={FaBug} size={16} />
                </DebugButton>
            )}
            
            {showDebug && (
                <DebugOverlay>
                    <h4>Debug Log</h4>
                    <pre>
                        {debugLogs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </pre>
                </DebugOverlay>
            )}
            
            <PlayPauseButton
                onClick={toggleMetronome}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={metronomePlaying ? "Pause metronome" : "Play metronome"}
            >
                <IconWrapper>
                    {metronomePlaying ? <Icon icon={FaPause} size={24} /> : <Icon icon={FaPlay} size={24} />}
                </IconWrapper>
            </PlayPauseButton>

            <MetronomeDisplay>
                <DialDisplay>
                    <span className="dial-label">BPM |</span>
                    <input
                        className="bpm-input"
                        type="text"
                        inputMode="numeric"
                        value={bpmInput}
                        onChange={handleBpmInputChange}
                        onBlur={commitBpmInput}
                        onKeyDown={handleBpmInputKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.target.select()}
                        aria-label="BPM value"
                    />
                    <span className="dial-label">Time |</span>
                    <div ref={tsDropdownRef} style={{ position: 'relative' }}>
                        <button
                            className="ts-button"
                            onClick={(e) => { e.stopPropagation(); setShowTsDropdown(!showTsDropdown); }}
                            aria-label="Time signature"
                        >
                            {timeSignature}
                        </button>
                        {showTsDropdown && (
                            <TsDropdownWrapper>
                                <TsDropdown>
                                    {TIME_SIGNATURE_OPTIONS.map((ts) => (
                                        <TsDropdownOption
                                            key={ts}
                                            $isSelected={ts === timeSignature}
                                            onClick={(e) => { e.stopPropagation(); handleTsSelect(ts); }}
                                        >
                                            {ts}
                                        </TsDropdownOption>
                                    ))}
                                </TsDropdown>
                            </TsDropdownWrapper>
                        )}
                    </div>
                </DialDisplay>
                <MetronomeBase
                    $useGradient={useGradient}
                    onClick={toggleMetronome}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                />
                <MetronomePendulum
                    $useGradient={useGradient}
                    key={`pendulum-${bpm}-${metronomePlaying}`}
                    animate={{
                        rotate: metronomePlaying ? [20, -20, 20] : 0
                    }}
                    transition={metronomePlaying ? {
                        repeat: Infinity,
                        duration: 60 / bpm,
                        ease: "easeInOut",
                        repeatType: "loop"
                    } : {
                        duration: 0.3,
                        ease: "easeOut"
                    }}
                    onClick={toggleMetronome}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                />
                <BpmControls>
                    <ControlButton
                        onClick={handleDecreaseBpm}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Decrease BPM"
                    >
                        <IconWrapper>
                            <Icon icon={FaMinus} size={18} />
                        </IconWrapper>
                    </ControlButton>
                    <ControlButton
                        onClick={handleIncreaseBpm}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Increase BPM"
                    >
                        <IconWrapper>
                            <Icon icon={FaPlus} size={18} />
                        </IconWrapper>
                    </ControlButton>
                </BpmControls>
            </MetronomeDisplay>
            
            <BeatsRow>
                {beats.map((beat) => (
                    <BeatIndicator
                        key={beat}
                        animate={{
                            scale: currentBeat === beat && metronomePlaying ? [1, 1.5, 1] : 1,
                            backgroundColor: currentBeat === beat && metronomePlaying ?
                                [theme.colors.primary, theme.colors.accent, theme.colors.primary] : theme.colors.primary
                        }}
                        transition={{ duration: 0.2 }}
                    />
                ))}
            </BeatsRow>

            <ControlsContainer>
                <ControlButton
                    onClick={toggleMute}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={muteSound ? "Unmute sound" : "Mute sound"}
                >
                    <IconWrapper>
                        {muteSound ? <Icon icon={FaVolumeMute} size={24} /> : <Icon icon={FaVolumeUp} size={24} />}
                    </IconWrapper>
                </ControlButton>
            </ControlsContainer>
            <TipsModal
                isOpen={showTips}
                onClose={() => setShowTips(false)}
                title="How to Use the Metronome"
                content={
                    <>
                        <p>
                            You can click directly on the metronome dial to start or stop playback.
                        </p>
                        <p>
                            Use the + and – controls to adjust BPM, or click directly on the BPM input field to change the tempo.
                        </p>
                        <p>
                            Click the time signature on the dial to change it. Supported: {TIME_SIGNATURE_OPTIONS.join(', ')}.
                        </p>
                        <p>
                            The beat dots reflect the current time signature, with accented beats highlighted.
                        </p>
                    </>
                }
            />
        </ToolCardDnd>
    );
};

export default Metronome;
