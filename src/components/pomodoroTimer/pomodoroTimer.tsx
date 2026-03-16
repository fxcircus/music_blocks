import React, { useState, useEffect, useRef } from "react";
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUndo, FaPlay, FaPause, FaCoffee, FaCog, FaVolumeMute, FaVolumeUp, FaMinus, FaPlus, FaBriefcase, FaTrophy, FaClock } from 'react-icons/fa';
import { GiTomato } from 'react-icons/gi';
import ToolCardDnd from '../common/ToolCardDnd';
import { Icon } from '../../utils/IconHelper';
import TipsModal from '../common/TipsModal';
import HelpButton from '../common/HelpButton';
import PracticeHeatmap from './PracticeHeatmap';

// Styled components
const TimerWrapper = styled(motion.div)`
  position: relative;
  width: 210px;
  height: 210px;
  margin: 0 auto;
  cursor: pointer;
  --ring-primary: ${({ theme }) => theme.colors.primary};
`;

const ProgressRingSvg = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  pointer-events: none;
`;

const TimerDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.timerBackground};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 8px);
  width: calc(100% - 8px);
  position: absolute;
  top: 4px;
  left: 4px;
`;

const TimerTime = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.timer};
  font-weight: 700;
  line-height: 1;
`;

const InnerModeLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  position: absolute;
  bottom: 50px;
`;

const ViewArea = styled.div`
  height: 290px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const InnerSessionDots = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

const InnerDot = styled.div<{ $completed: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $completed }) =>
    $completed ? theme.colors.primary : theme.colors.border};
  transition: background 0.3s ease;
`;

const TimerControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  width: 210px;
  margin: 0 auto;
`;

const TimerButton = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  padding: ${({ theme }) => theme.spacing.sm};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const PlayPauseButton = styled(TimerButton)`
  font-size: ${({ theme }) => theme.fontSizes.xxxl};
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  padding: ${({ theme }) => theme.spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  z-index: 100;
  min-width: 220px;
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

const SettingsDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: ${({ theme }) => `${theme.spacing.xs} 0`};
`;

const FlowToggleContainer = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 2px;
`;

const FlowToggleBtn = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $active, theme }) => $active ? theme.colors.primary + '22' : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primary + '33' : theme.colors.border};
  }
`;

const SettingsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SettingsLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  width: 48px;
  flex-shrink: 0;
`;

const SettingsInput = styled.input`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  font-weight: 600;
  width: 52px;
  text-align: center;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  padding: 4px 2px;
  outline: none;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
`;

const SmallButton = styled(motion.button)`
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const VolumeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.xs} 0`};
`;

const VolumeSlider = styled.input`
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
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

const VolumeIcon = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.md};
  flex-shrink: 0;
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const getProgressColor = (fraction: number): string => {
  if (fraction > 0.6) return '#4caf50';
  if (fraction > 0.3) return '#ff9800';
  return '#f44336';
};

// Sound helpers
const playTone = (ctx: AudioContext, freq: number, startTime: number, duration: number, volume: number = 0.3) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
};

const STORAGE_KEY = 'flowTimerSettings';

const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
};

const saveSettings = (settings: { workMinutes: number; breakMinutes: number; longBreakMinutes: number; alertVolume: number }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const PRACTICE_LOG_KEY = 'blocks-practice-log';

interface PracticeEntry {
  date: string;
  count: number;
}

const loadPracticeLog = (): PracticeEntry[] => {
  try {
    const stored = localStorage.getItem(PRACTICE_LOG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
};

const logPracticeSession = () => {
  const log = loadPracticeLog();
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const existing = log.find(e => e.date === dateStr);
  if (existing) {
    existing.count++;
  } else {
    log.push({ date: dateStr, count: 1 });
  }
  localStorage.setItem(PRACTICE_LOG_KEY, JSON.stringify(log));
  return log;
};

interface PomodoroTimerProps {
  onRemove?: () => void;
  canRemove?: boolean;
  dragHandleProps?: any;
  isRecentlyDragged?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  expandDisabled?: boolean;
}

export default function PomodoroTimer({
  onRemove,
  canRemove,
  dragHandleProps,
  isRecentlyDragged,
  isExpanded,
  onToggleExpand,
  expandDisabled
}: PomodoroTimerProps = {}) {
  const initialWork = (loadSettings()?.workMinutes ?? 25) * 60;
  const [time, setTime] = useState(initialWork);
  const [totalTime, setTotalTime] = useState(initialWork);
  const [isCounting, setIsCounting] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const saved = useRef(loadSettings());
  const [alertVolume, setAlertVolume] = useState(() => {
    if (saved.current?.alertVolume !== undefined) return saved.current.alertVolume;
    if (saved.current?.muteAlert === true) return 0;
    return 0.3;
  });
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [workMinutes, setWorkMinutes] = useState(saved.current?.workMinutes ?? 25);
  const [breakMinutes, setBreakMinutes] = useState(saved.current?.breakMinutes ?? 5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(saved.current?.longBreakMinutes ?? 15);
  const [showHeatmap, setShowHeatmap] = useState(() => localStorage.getItem('flowViewMode') === 'history');
  const [practiceLog, setPracticeLog] = useState<PracticeEntry[]>(loadPracticeLog);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const preMuteVolumeRef = useRef(alertVolume > 0 ? alertVolume : 0.3);

  useEffect(() => {
    if (!showSettings) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    // Delay attaching so the opening click doesn't immediately close
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleClickOutside);
    });
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  const secondsToMinutes = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Work done → time to relax: single long descending tone
  const playBreakSound = (vol?: number) => {
    const ctx = audioContextRef.current;
    const v = vol ?? alertVolume;
    if (!ctx || v === 0) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    playTone(ctx, 659.25, now, 1.0, v);
  };

  // Break done → back to work: quick double tap
  const playWorkSound = (vol?: number) => {
    const ctx = audioContextRef.current;
    const v = vol ?? alertVolume;
    if (!ctx || v === 0) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    playTone(ctx, 523.25, now, 0.15, v);
    playTone(ctx, 523.25, now + 0.2, 0.15, v);
  };

  // Full cycle complete (after long break): three ascending tones
  const playCycleCompleteSound = (vol?: number) => {
    const ctx = audioContextRef.current;
    const v = vol ?? alertVolume;
    if (!ctx || v === 0) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    playTone(ctx, 523.25, now, 0.4, v);
    playTone(ctx, 659.25, now + 0.2, 0.4, v);
    playTone(ctx, 783.99, now + 0.4, 0.6, v);
  };

  // Ref to always have the latest completion handler (avoids stale closures in interval)
  const completionRef = useRef<() => void>(() => {});
  completionRef.current = () => {
    if (mode === 'work') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      const goingToLongBreak = newSessions % 4 === 0;
      const dur = goingToLongBreak ? longBreakMinutes * 60 : breakMinutes * 60;
      playBreakSound();
      setIsLongBreak(goingToLongBreak);
      setMode('break');
      setTime(dur);
      setTotalTime(dur);
      // Log completed focus session
      const updatedLog = logPracticeSession();
      setPracticeLog(updatedLog);
    } else {
      // Break ending → back to work
      if (isLongBreak) {
        playCycleCompleteSound();
      } else {
        playWorkSound();
      }
      setIsLongBreak(false);
      const dur = workMinutes * 60;
      setMode('work');
      setTime(dur);
      setTotalTime(dur);
    }
    // isCounting stays true → auto-start next phase
  };

  const resetTimer = () => {
    setIsCounting(false);
    setIsLongBreak(false);
    const dur = workMinutes * 60;
    setMode('work');
    setTime(dur);
    setTotalTime(dur);
  };

  const takeBreak = () => {
    setIsCounting(false);
    setIsLongBreak(false);
    const dur = breakMinutes * 60;
    setMode('break');
    setTime(dur);
    setTotalTime(dur);
  };

  const skipToWork = () => {
    setIsCounting(false);
    setIsLongBreak(false);
    const dur = workMinutes * 60;
    setMode('work');
    setTime(dur);
    setTotalTime(dur);
  };

  const toggleCountdown = () => {
    // Ensure audio context is ready (must happen on user gesture)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsCounting(!isCounting);
  };

  useEffect(() => {
    if (isCounting) {
      intervalIdRef.current = setInterval(() => {
        if (time <= 0) {
          if (intervalIdRef.current) clearInterval(intervalIdRef.current);
          completionRef.current();
        } else {
          setTime(prevTime => prevTime - 1);
        }
      }, 1000);
    } else if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [isCounting, time]);

  // Apply settings changes immediately when not counting
  useEffect(() => {
    if (!isCounting && mode === 'work') {
      const dur = workMinutes * 60;
      setTime(dur);
      setTotalTime(dur);
    }
  }, [workMinutes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isCounting && mode === 'break' && !isLongBreak) {
      const dur = breakMinutes * 60;
      setTime(dur);
      setTotalTime(dur);
    }
  }, [breakMinutes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isCounting && mode === 'break' && isLongBreak) {
      const dur = longBreakMinutes * 60;
      setTime(dur);
      setTotalTime(dur);
    }
  }, [longBreakMinutes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist settings to localStorage
  useEffect(() => {
    saveSettings({ workMinutes, breakMinutes, longBreakMinutes, alertVolume });
  }, [workMinutes, breakMinutes, longBreakMinutes, alertVolume]);

  // Play alert sound once when the user releases the volume slider
  const alertVolumeRef = useRef(alertVolume);
  alertVolumeRef.current = alertVolume;

  const previewAlertSound = () => {
    if (alertVolumeRef.current === 0) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    playBreakSound(alertVolumeRef.current);
  };

  const toggleMute = () => {
    if (alertVolume > 0) {
      preMuteVolumeRef.current = alertVolume;
      setAlertVolume(0);
    } else {
      setAlertVolume(preMuteVolumeRef.current);
    }
  };

  // Show all 4 dots filled during a long break after completing 4 sessions
  const sessionsInCycle = sessionsCompleted % 4;
  const dotsToShow = mode === 'break' && sessionsInCycle === 0 && sessionsCompleted > 0
    ? 4
    : sessionsInCycle;

  const modeLabel = mode === 'work' ? 'Focus' : isLongBreak ? 'Long' : 'Break';

  return (
    <ToolCardDnd
      title="Flow"
      icon={GiTomato}
      onRemove={onRemove}
      dragHandleProps={dragHandleProps}
      isRecentlyDragged={isRecentlyDragged}
      canRemove={canRemove}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      expandDisabled={expandDisabled}
      additionalControls={
        <>
          <div ref={settingsRef} style={{ position: 'relative' }}>
            <SettingsIconBtn $active={showSettings} onClick={() => setShowSettings(!showSettings)} title="Timer settings">
              <Icon icon={FaCog} size={16} />
            </SettingsIconBtn>
            <AnimatePresence>
              {showSettings && (
                <SettingsDropdown
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SettingsRow>
                    <SettingsHeader>View Mode</SettingsHeader>
                    <FlowToggleContainer>
                      <FlowToggleBtn $active={!showHeatmap} onClick={() => { setShowHeatmap(false); localStorage.setItem('flowViewMode', 'timer'); }} title="Timer">
                        <Icon icon={FaClock} size={12} />
                      </FlowToggleBtn>
                      <FlowToggleBtn $active={showHeatmap} onClick={() => { setShowHeatmap(true); localStorage.setItem('flowViewMode', 'history'); }} title="Session history">
                        <Icon icon={FaTrophy} size={12} />
                      </FlowToggleBtn>
                    </FlowToggleContainer>
                  </SettingsRow>

                  <VolumeRow>
                    <VolumeIcon
                      onClick={toggleMute}
                      title={alertVolume === 0 ? "Unmute alert" : "Mute alert"}
                    >
                      <Icon icon={alertVolume === 0 ? FaVolumeMute : FaVolumeUp} size={16} />
                    </VolumeIcon>
                    <VolumeSlider
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={alertVolume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (v > 0) preMuteVolumeRef.current = v;
                        setAlertVolume(v);
                      }}
                      onMouseUp={previewAlertSound}
                      onTouchEnd={previewAlertSound}
                      title={`Alert volume: ${Math.round(alertVolume * 100)}%`}
                    />
                  </VolumeRow>
                  <SettingsDivider />
                  <SettingsHeader>Timer</SettingsHeader>
                  <SettingsRow>
                    <SettingsLabel>Focus</SettingsLabel>
                    <SmallButton onClick={() => setWorkMinutes(Math.max(1, workMinutes - 1))} whileTap={{ scale: 0.9 }} title="Decrease focus time">
                      <Icon icon={FaMinus} size={10} />
                    </SmallButton>
                    <SettingsInput
                      type="number"
                      value={workMinutes}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setWorkMinutes(v); }}
                      onBlur={() => setWorkMinutes(Math.max(1, Math.min(60, workMinutes)))}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      title="Focus duration in minutes (1–60)"
                    />
                    <SmallButton onClick={() => setWorkMinutes(Math.min(60, workMinutes + 1))} whileTap={{ scale: 0.9 }} title="Increase focus time">
                      <Icon icon={FaPlus} size={10} />
                    </SmallButton>
                  </SettingsRow>

                  <SettingsRow>
                    <SettingsLabel>Break</SettingsLabel>
                    <SmallButton onClick={() => setBreakMinutes(Math.max(1, breakMinutes - 1))} whileTap={{ scale: 0.9 }} title="Decrease break time">
                      <Icon icon={FaMinus} size={10} />
                    </SmallButton>
                    <SettingsInput
                      type="number"
                      value={breakMinutes}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setBreakMinutes(v); }}
                      onBlur={() => setBreakMinutes(Math.max(1, Math.min(30, breakMinutes)))}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      title="Break duration in minutes (1–30)"
                    />
                    <SmallButton onClick={() => setBreakMinutes(Math.min(30, breakMinutes + 1))} whileTap={{ scale: 0.9 }} title="Increase break time">
                      <Icon icon={FaPlus} size={10} />
                    </SmallButton>
                  </SettingsRow>

                  <SettingsRow>
                    <SettingsLabel>Long</SettingsLabel>
                    <SmallButton onClick={() => setLongBreakMinutes(Math.max(2, longBreakMinutes - 1))} whileTap={{ scale: 0.9 }} title="Decrease long break time">
                      <Icon icon={FaMinus} size={10} />
                    </SmallButton>
                    <SettingsInput
                      type="number"
                      value={longBreakMinutes}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setLongBreakMinutes(v); }}
                      onBlur={() => setLongBreakMinutes(Math.max(2, Math.min(60, longBreakMinutes)))}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      title="Long break duration in minutes (2–60)"
                    />
                    <SmallButton onClick={() => setLongBreakMinutes(Math.min(60, longBreakMinutes + 1))} whileTap={{ scale: 0.9 }} title="Increase long break time">
                      <Icon icon={FaPlus} size={10} />
                    </SmallButton>
                  </SettingsRow>
                </SettingsDropdown>
              )}
            </AnimatePresence>
          </div>
          <HelpButton onClick={() => setShowTips(true)} />
        </>
      }
    >
      <ViewArea>
        {showHeatmap ? (
          <PracticeHeatmap data={practiceLog} />
        ) : (
          <>
            {(() => {
              const fraction = totalTime > 0 ? time / totalTime : 1;
              const radius = 100;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference * fraction;
              const color = getProgressColor(fraction);
              return (
                <TimerWrapper
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  onClick={toggleCountdown}
                  aria-label={isCounting ? "Pause timer" : "Start timer"}
                >
                  <ProgressRingSvg viewBox="0 0 210 210">
                    <circle
                      cx="105"
                      cy="105"
                      r={radius}
                      fill="none"
                      stroke="var(--ring-primary)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="105"
                      cy="105"
                      r={radius}
                      fill="none"
                      stroke={color}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
                    />
                  </ProgressRingSvg>
                  <TimerDisplay>
                    <TimerTime>{secondsToMinutes(time)}</TimerTime>
                    <InnerModeLabel>{modeLabel}</InnerModeLabel>
                  </TimerDisplay>
                </TimerWrapper>
              );
            })()}

            <InnerSessionDots>
              {[0, 1, 2, 3].map(i => (
                <InnerDot key={i} $completed={i < dotsToShow} />
              ))}
            </InnerSessionDots>
          </>
        )}
      </ViewArea>

      <TimerControls>
        <TimerButton
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={resetTimer}
          title="Reset timer to initial focus duration"
        >
          <IconWrapper><Icon icon={FaUndo} size={20} /></IconWrapper>
        </TimerButton>

        <PlayPauseButton
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCountdown}
          title={isCounting ? "Pause timer" : "Start timer"}
        >
          <IconWrapper>
            {isCounting ? <Icon icon={FaPause} size={24} /> : <Icon icon={FaPlay} size={24} />}
          </IconWrapper>
        </PlayPauseButton>

        <TimerButton
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={mode === 'work' ? takeBreak : skipToWork}
          title={mode === 'work' ? "Skip to break" : "Skip to focus"}
        >
          <IconWrapper>
            <Icon icon={mode === 'work' ? FaCoffee : FaBriefcase} size={24} />
          </IconWrapper>
        </TimerButton>
      </TimerControls>

      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        title="How Flow Works"
        content={
          <>
            <p>
              This timer follows the Pomodoro technique. Work in focused intervals, then take a short break. After 4 sessions, a longer break is triggered automatically.
            </p>
            <p>
              The timer auto-transitions between focus and break periods. Click the timer face or the play button to start and pause.
            </p>
            <p>
              Use the gear icon to set focus, break, and long break durations. You can type a value directly into each field or use the +/- buttons. The volume slider controls the alert sound — click the speaker icon to mute or unmute.
            </p>
            <p>
              The trophy icon opens your session history — a heatmap showing your activity over the last 16 weeks. Each completed focus session is tracked automatically. Build a streak to unlock milestone badges.
            </p>
          </>
        }
      />
    </ToolCardDnd>
  );
}
