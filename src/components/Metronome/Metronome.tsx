import React, { FC, useEffect, useState, useRef, useCallback } from "react";
import styled, { useTheme } from 'styled-components';
import { ThemeName, useTheme as useAppTheme, THEME_ORDER, THEME_LABELS, lightTheme, darkTheme, vintageTheme, indieTheme, discoTheme, hiphopTheme } from '../../theme/ThemeProvider';
import { useSoundSettings } from '../../context/SoundSettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from 'styled-components';
import { FaPlay, FaPause, FaPlus, FaMinus, FaBug, FaVolumeMute, FaVolumeOff, FaVolumeDown, FaVolumeUp, FaCog, FaCheck } from 'react-icons/fa';
import { GiMetronome } from 'react-icons/gi';
import { Icon } from '../../utils/IconHelper';
import ThemeIcon from '../Nav/ThemeIcons';
import ToolCardDnd from '../common/ToolCardDnd';
import TipsModal from '../common/TipsModal';
import HelpButton from '../common/HelpButton';
import config from '../../config';

type ThemeOverride = 'byTheme' | ThemeName;

const THEME_PRIMARY: Record<ThemeName, string> = {
  light: lightTheme.colors.primary,
  dark: darkTheme.colors.primary,
  vintage: vintageTheme.colors.primary,
  indie: indieTheme.colors.primary,
  disco: discoTheme.colors.primary,
  hiphop: hiphopTheme.colors.primary,
};

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

// Blocks mode helpers
function getRows(totalBeats: number): number[] {
  if (totalBeats <= 4) return [totalBeats];
  if (totalBeats === 5) return [3, 2];
  if (totalBeats === 6) return [3, 3];
  if (totalBeats === 7) return [4, 3];
  return [totalBeats];
}

function getRowCount(totalBeats: number): number {
  return getRows(totalBeats).length;
}

const blockPulse = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.12); }
  100% { transform: scale(1); }
`;

const modeFade = keyframes`
  0% { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
`;

// Toggle in header (reused inside settings dropdown)
const MetronomeToggleContainer = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  padding: 2px;
`;

const MetronomeToggleBtn = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $active, theme }) => $active ? theme.colors.primary + '22' : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primary + '33' : theme.colors.border};
  }
`;

/* Cogwheel settings button – sized to match HelpButton (28×28) */
const SettingsIconBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: ${({ theme }) => theme.spacing.xs};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  background: ${({ $active, theme }) => $active ? `${theme.colors.primary}22` : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active, theme }) => $active ? `${theme.colors.primary}33` : `${theme.colors.primary}22`};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SettingsDropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  min-width: 180px;
  overflow: visible;
  padding: ${({ theme }) => theme.spacing.sm};
`;

const SettingsDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: ${({ theme }) => `${theme.spacing.xs} 0`};
`;

const SettingsHeader = styled.div`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  text-align: left;
`;

const SettingsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
`;

const SVolRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
`;

const SVolIcon = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SVolSlider = styled.input`
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    border: none;
  }
`;

const SVolPercent = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 32px;
  text-align: right;
`;

const ByThemeButton = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 4px ${({ theme }) => theme.spacing.sm};
  background: ${({ $active, theme }) => $active ? `${theme.colors.primary}18` : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ $active }) => $active ? 700 : 500};
  transition: background-color ${({ theme }) => theme.transitions.fast}, color ${({ theme }) => theme.transitions.fast};
  text-align: left;
  border-radius: ${({ theme }) => theme.borderRadius.small};

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}11`};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SIconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  margin-top: 2px;
`;

const SIconButton = styled.button<{ $active: boolean; $isByThemeHint: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ $active, $isByThemeHint, theme }) =>
    $active ? `${theme.colors.primary}22` :
    $isByThemeHint ? `${theme.colors.textSecondary}10` :
    'transparent'};
  border: 1.5px solid ${({ $active, $isByThemeHint, theme }) =>
    $active ? theme.colors.primary :
    $isByThemeHint ? theme.colors.textSecondary + '40' :
    theme.colors.border + '80'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  opacity: ${({ $isByThemeHint }) => $isByThemeHint ? 0.45 : 1};
  margin: 0 auto;

  &:hover {
    transform: scale(1.1);
    opacity: 1;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

// Fixed-height content area
const ContentArea = styled.div`
  width: 100%;
  position: relative;
  height: 210px;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

// Pendulum (kept for pendulum mode)
const MetronomePendulum = styled(motion.div)`
  width: 6px;
  height: 144px;
  background: ${({ theme }) => theme.colors.primary};
  position: absolute;
  bottom: 40px;
  left: 50%;
  margin-left: -3px;
  z-index: 0;
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
    width: 26px;
    height: 26px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

// Blocks mode area
const BlocksArea = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 0;
  cursor: pointer;
  animation: ${modeFade} 0.25s ease-out;
`;

const BlockRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex: 1;
  align-items: center;
  max-height: 120px;
`;

const StyledBeatBlock = styled.div<{ $isActive: boolean; $isPlaying: boolean }>`
  aspect-ratio: 1;
  height: 100%;
  max-height: 100%;
  border-radius: 8px;
  border: 2px solid ${({ $isActive, $isPlaying, theme }) =>
    $isActive && $isPlaying ? theme.colors.primary : theme.colors.border};
  background: ${({ $isActive, $isPlaying, theme }) =>
    $isActive && $isPlaying ? theme.colors.primary : theme.colors.background};
  transition: ${({ $isActive, $isPlaying }) =>
    $isActive && $isPlaying ? 'none' : 'all 0.15s ease'};
  animation: ${({ $isActive, $isPlaying }) =>
    $isActive && $isPlaying ? blockPulse : 'none'} 0.15s ease-out;
  box-shadow: ${({ $isActive, $isPlaying, theme }) =>
    $isActive && $isPlaying
      ? theme.shadows.medium
      : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BeatNumber = styled.span<{ $isActive: boolean; $isPlaying: boolean; $isLarge: boolean }>`
  font-size: ${({ $isLarge }) => $isLarge ? '24px' : '16px'};
  font-weight: 700;
  color: ${({ $isActive, $isPlaying, theme }) =>
    $isActive && $isPlaying ? '#fff' : theme.colors.border};
  transition: color 0.15s;
`;

// Unified control pill
const ControlPillContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
`;

const ControlPillStyled = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: 6px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  white-space: nowrap;
`;

const PillButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  cursor: pointer;
  font-weight: 700;
  line-height: 1;
  padding: 0 2px;
  display: flex;
  align-items: center;

  &:hover {
    color: #fff;
  }
`;

const PillLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
`;

const PillSeparator = styled.div`
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.25);
  margin: 0 2px;
`;

const PillInput = styled.input`
  background: none;
  border: none;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  width: 36px;
  text-align: center;
  outline: none;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  cursor: pointer;
`;

const PillTsButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0 2px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
`;

// Pendulum mode wrapper
const PendulumArea = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  animation: ${modeFade} 0.25s ease-out;
  padding-top: 8px;
`;

const TsDropdownWrapper = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
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
  width: 100%;
  margin-bottom: 16px;
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
  // Light — soft wooden tap (triangle through lowpass)
  light: {
    play(ctx, time, isAccent, volume) {
      const master = createMasterGain(ctx, volume);
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = isAccent ? 1000 : 600;
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
      filter.Q.value = 0.7;
      const vol = isAccent ? 0.4 : 0.25;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.10);
      osc.start(time);
      osc.stop(time + 0.10);
    },
  },
  // Vintage — finger snap (swapped from disco)
  vintage: {
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
  // Disco — bright woodblock knock (swapped from vintage)
  disco: {
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
    const { effectiveMetronomeTheme, metronomeVolume, setMetronomeVolume, metronomeThemeOverride, setMetronomeThemeOverride } = useSoundSettings();
    // State
    const [metronomeMode, setMetronomeMode] = useState<'blocks' | 'pendulum'>(() =>
      (localStorage.getItem('metronomeMode') as 'blocks' | 'pendulum') || 'blocks'
    );
    const [metronomePlaying, setMetronomePlaying] = useState(false);
    const [muteSound] = useState(false);
    const [bpm, setBpm] = useState(initialBpm);
    const [currentBeat, setCurrentBeat] = useState(0);
    const [showTips, setShowTips] = useState(false);
    const [bpmInput, setBpmInput] = useState(String(initialBpm));
    const [timeSignature, setTimeSignature] = useState(initialTimeSignature);
    const [showTsDropdown, setShowTsDropdown] = useState(false);
    const [tapFlash, setTapFlash] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const tsDropdownRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const preMuteVolumeRef = useRef(0.3);
    const tapTimesRef = useRef<number[]>([]);
    const tapResetTimerRef = useRef<NodeJS.Timeout | null>(null);

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
            if (tapResetTimerRef.current !== null) {
                clearTimeout(tapResetTimerRef.current);
                tapResetTimerRef.current = null;
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
        if (!metronomePlaying) {
            setCurrentBeat(0);
        }
        setMetronomePlaying(!metronomePlaying);
    };
    
    const handleTapTempo = () => {
        // Visual flash feedback
        setTapFlash(true);
        setTimeout(() => setTapFlash(false), 120);

        const now = performance.now();

        // Clear previous auto-reset timer
        if (tapResetTimerRef.current) {
            clearTimeout(tapResetTimerRef.current);
        }

        // Schedule auto-reset after 1 second of inactivity
        tapResetTimerRef.current = setTimeout(() => {
            tapTimesRef.current = [];
            tapResetTimerRef.current = null;
        }, 1000);

        tapTimesRef.current.push(now);

        // Keep only last 8 taps
        if (tapTimesRef.current.length > 8) {
            tapTimesRef.current = tapTimesRef.current.slice(-8);
        }

        const currentTaps = tapTimesRef.current;
        if (currentTaps.length >= 2) {
            // Calculate average interval across consecutive taps
            const intervals: number[] = [];
            for (let i = 1; i < currentTaps.length; i++) {
                intervals.push(currentTaps[i] - currentTaps[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const tapBpm = Math.round(60000 / avgInterval);
            const clampedBpm = Math.max(40, Math.min(300, tapBpm));

            debugLog(`Tap tempo: ${clampedBpm} BPM (from ${currentTaps.length} taps)`);

            // Update local BPM only — do NOT sync back to Generator
            ignoreExternalUpdatesRef.current = true;
            setBpm(clampedBpm);

            if (ignoreTimeoutRef.current) {
                clearTimeout(ignoreTimeoutRef.current);
            }
            ignoreTimeoutRef.current = setTimeout(() => {
                ignoreExternalUpdatesRef.current = false;
                ignoreTimeoutRef.current = null;
            }, 500);
        }
    };

    const handleSetMode = (mode: 'blocks' | 'pendulum') => {
        setMetronomeMode(mode);
        localStorage.setItem('metronomeMode', mode);
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

    // Close settings dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        };
        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettings]);

    const getVolumeIcon = () => {
        if (metronomeVolume === 0 || muteSound) return FaVolumeMute;
        if (metronomeVolume < 0.33) return FaVolumeOff;
        if (metronomeVolume < 0.66) return FaVolumeDown;
        return FaVolumeUp;
    };

    const toggleMute = useCallback(() => {
        if (metronomeVolume > 0) {
            preMuteVolumeRef.current = metronomeVolume;
            setMetronomeVolume(0);
        } else {
            setMetronomeVolume(preMuteVolumeRef.current);
        }
    }, [metronomeVolume, setMetronomeVolume]);

    const blocksMode = metronomeMode === 'blocks';
    const rows = getRows(beats.length);
    const isLargeBlock = getRowCount(beats.length) === 1;

    return (
        <ToolCardDnd
            title="Metronome"
            icon={GiMetronome}
            onRemove={onRemove}
            canRemove={canRemove}
            dragHandleProps={dragHandleProps}
            isRecentlyDragged={isRecentlyDragged}
            additionalControls={
                <>
                    <HelpButton onClick={() => setShowTips(true)} />
                    <div ref={settingsRef} style={{ position: 'relative' }}>
                        <SettingsIconBtn
                            $active={showSettings}
                            onClick={() => setShowSettings(!showSettings)}
                            title="Metronome settings"
                        >
                            <Icon icon={FaCog} size={16} />
                        </SettingsIconBtn>
                        <AnimatePresence>
                            {showSettings && (
                                <SettingsDropdown
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                    {/* View Mode — header + toggle inline */}
                                    <SettingsRow>
                                        <SettingsHeader style={{ padding: 0 }}>View Mode</SettingsHeader>
                                        <MetronomeToggleContainer>
                                            <MetronomeToggleBtn
                                                $active={blocksMode}
                                                onClick={() => handleSetMode('blocks')}
                                                title="Blocks view"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                                                    <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                                                    <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                                                    <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                                                    <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                                                </svg>
                                            </MetronomeToggleBtn>
                                            <MetronomeToggleBtn
                                                $active={!blocksMode}
                                                onClick={() => handleSetMode('pendulum')}
                                                title="Pendulum view"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                                                    <line x1="9" y1="2" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                                    <circle cx="9" cy="2" r="2" fill="currentColor"/>
                                                    <rect x="2" y="13" width="14" height="3" rx="1.5" fill="currentColor"/>
                                                </svg>
                                            </MetronomeToggleBtn>
                                        </MetronomeToggleContainer>
                                    </SettingsRow>

                                    <SettingsDivider />

                                    {/* Volume */}
                                    <SVolRow>
                                        <SVolIcon
                                            onClick={toggleMute}
                                            title={metronomeVolume === 0 ? 'Unmute' : 'Mute'}
                                        >
                                            <Icon icon={getVolumeIcon()} size={16} />
                                        </SVolIcon>
                                        <SVolSlider
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={metronomeVolume}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const v = parseFloat(e.target.value);
                                                if (v > 0) preMuteVolumeRef.current = v;
                                                setMetronomeVolume(v);
                                            }}
                                            title={`Volume: ${Math.round(metronomeVolume * 100)}%`}
                                        />
                                        <SVolPercent>{Math.round(metronomeVolume * 100)}%</SVolPercent>
                                    </SVolRow>

                                    <SettingsDivider />

                                    {/* Sound theme */}
                                    <SettingsHeader>Sound</SettingsHeader>
                                    <ByThemeButton
                                        $active={metronomeThemeOverride === 'byTheme'}
                                        onClick={() => setMetronomeThemeOverride('byTheme')}
                                    >
                                        <span style={{ flex: 1 }}>By Theme</span>
                                        {metronomeThemeOverride === 'byTheme' && (
                                            <span style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                                                <Icon icon={FaCheck} size={10} />
                                            </span>
                                        )}
                                    </ByThemeButton>
                                    <SIconGrid>
                                        {THEME_ORDER.map((t) => {
                                            const isActive = metronomeThemeOverride === t;
                                            const isByThemeHint = metronomeThemeOverride === 'byTheme' && t === themeName;
                                            return (
                                                <SIconButton
                                                    key={t}
                                                    $active={isActive}
                                                    $isByThemeHint={isByThemeHint}
                                                    onClick={() => setMetronomeThemeOverride(t as ThemeOverride)}
                                                    title={THEME_LABELS[t]}
                                                >
                                                    <span style={{ color: THEME_PRIMARY[t], display: 'inline-flex' }}>
                                                        <ThemeIcon theme={t} size={18} />
                                                    </span>
                                                </SIconButton>
                                            );
                                        })}
                                    </SIconGrid>
                                </SettingsDropdown>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            }
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

            <ContentArea>
                {/* Blocks mode */}
                {blocksMode && (
                    <BlocksArea onClick={toggleMetronome}>
                        {(() => {
                            let idx = 0;
                            return rows.map((count, rowIdx) => {
                                const rowBeats: number[] = [];
                                for (let i = 0; i < count; i++) { rowBeats.push(idx); idx++; }
                                return (
                                    <BlockRow key={rowIdx}>
                                        {rowBeats.map((beat) => (
                                            <StyledBeatBlock
                                                key={beat}
                                                $isActive={currentBeat === beat}
                                                $isPlaying={metronomePlaying}
                                            >
                                                <BeatNumber $isActive={currentBeat === beat} $isPlaying={metronomePlaying} $isLarge={isLargeBlock}>
                                                    {beat + 1}
                                                </BeatNumber>
                                            </StyledBeatBlock>
                                        ))}
                                    </BlockRow>
                                );
                            });
                        })()}
                    </BlocksArea>
                )}

                {/* Pendulum mode */}
                {!blocksMode && (
                    <PendulumArea>
                        {/* Beat dots — above the pendulum */}
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
                        <MetronomePendulum
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
                    </PendulumArea>
                )}

                {/* Control pill — always pinned at bottom */}
                <ControlPillContainer>
                    <ControlPillStyled>
                        <PillButton onClick={(e) => { e.stopPropagation(); handleDecreaseBpm(); }} aria-label="Decrease BPM">
                            <Icon icon={FaMinus} size={10} />
                        </PillButton>
                        <PillLabel>BPM</PillLabel>
                        <PillInput
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
                        <PillButton onClick={(e) => { e.stopPropagation(); handleIncreaseBpm(); }} aria-label="Increase BPM">
                            <Icon icon={FaPlus} size={10} />
                        </PillButton>
                        <PillSeparator />
                        <PillButton
                            onClick={(e) => { e.stopPropagation(); toggleMetronome(); }}
                            aria-label={metronomePlaying ? "Stop metronome" : "Play metronome"}
                            title={metronomePlaying ? "Stop" : "Play"}
                        >
                            {metronomePlaying ? <Icon icon={FaPause} size={10} /> : <Icon icon={FaPlay} size={10} />}
                        </PillButton>
                        <PillSeparator />
                        <PillButton
                            onClick={(e) => { e.stopPropagation(); handleTapTempo(); }}
                            aria-label="Tap tempo"
                            title="Tap tempo"
                            style={{
                                color: tapFlash ? '#fff' : undefined,
                                background: tapFlash ? 'rgba(255,255,255,0.25)' : undefined,
                                borderRadius: 4,
                                transition: 'all 0.08s ease-out',
                            }}
                        >
                            <PillLabel style={{ color: tapFlash ? '#fff' : undefined }}>TAP</PillLabel>
                        </PillButton>
                        <PillSeparator />
                        <PillLabel>TIME</PillLabel>
                        <div ref={tsDropdownRef} style={{ position: 'relative' }}>
                            <PillTsButton
                                onClick={(e) => { e.stopPropagation(); setShowTsDropdown(!showTsDropdown); }}
                                aria-label="Time signature"
                            >
                                {timeSignature}
                            </PillTsButton>
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
                    </ControlPillStyled>
                </ControlPillContainer>
            </ContentArea>

            <TipsModal
                isOpen={showTips}
                onClose={() => setShowTips(false)}
                title="How to Use the Metronome"
                content={
                    <>
                        <p>
                            Use the toggle in the header to switch between Blocks and Pendulum views. Click on the blocks or pendulum to start/stop playback.
                        </p>
                        <p>
                            Use the − and + controls in the bottom pill to adjust BPM, or click directly on the BPM value to type a number.
                        </p>
                        <p>
                            Tap the TAP button rhythmically to set the tempo by feel — BPM is calculated from your tap intervals.
                        </p>
                        <p>
                            Click the time signature in the pill to change it. Supported: {TIME_SIGNATURE_OPTIONS.join(', ')}.
                        </p>
                        <p>
                            Use the speaker icon to choose from different metronome sounds and adjust the overall volume.
                        </p>
                    </>
                }
            />
        </ToolCardDnd>
    );
};

export default Metronome;
