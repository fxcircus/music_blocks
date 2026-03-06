import React, { useState, useEffect, useRef } from "react";
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUndo, FaPlay, FaPause, FaCoffee, FaCog, FaVolumeMute, FaVolumeUp, FaMinus, FaPlus, FaBriefcase } from 'react-icons/fa';
import { GiTomato } from 'react-icons/gi';
import ToolCardDnd from '../common/ToolCardDnd';
import { Icon } from '../../utils/IconHelper';
import TipsModal from '../common/TipsModal';
import HelpButton from '../common/HelpButton';

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
  height: 100%;
  width: 100%;
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
  margin-top: 10px;
`;

const InnerSessionDots = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 6px;
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
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
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

const SettingsPanel = styled(motion.div)`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
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

const SettingsValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  font-family: 'Courier New', monospace;
  font-weight: 600;
  min-width: 52px;
  text-align: center;
`;

const SmallButton = styled(motion.button)`
  width: 28px;
  height: 28px;
  background: ${({ theme }) => `${theme.colors.primary}20`};
  border: 1px solid ${({ theme }) => `${theme.colors.primary}60`};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}30`};
  }
`;

const MuteRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  padding: ${({ theme }) => `${theme.spacing.xs} 0`};
  color: ${({ theme }) => theme.colors.primary};

  &:hover {
    opacity: 0.8;
  }
`;

const MuteLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
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

interface PomodoroTimerProps {
  onRemove?: () => void;
  canRemove?: boolean;
  dragHandleProps?: any;
  isRecentlyDragged?: boolean;
}

export default function PomodoroTimer({
  onRemove,
  canRemove,
  dragHandleProps,
  isRecentlyDragged
}: PomodoroTimerProps = {}) {
  const [time, setTime] = useState(1500);
  const [totalTime, setTotalTime] = useState(1500);
  const [isCounting, setIsCounting] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [muteAlert, setMuteAlert] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const secondsToMinutes = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Work done → time to relax: single long descending tone
  const playBreakSound = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    playTone(ctx, 659.25, now, 1.0);
  };

  // Break done → back to work: quick double tap
  const playWorkSound = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    playTone(ctx, 523.25, now, 0.15, 0.25);
    playTone(ctx, 523.25, now + 0.2, 0.15, 0.25);
  };

  // Full cycle complete (after long break): three ascending tones
  const playCycleCompleteSound = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    playTone(ctx, 523.25, now, 0.4, 0.25);
    playTone(ctx, 659.25, now + 0.2, 0.4, 0.25);
    playTone(ctx, 783.99, now + 0.4, 0.6, 0.3);
  };

  // Ref to always have the latest completion handler (avoids stale closures in interval)
  const completionRef = useRef<() => void>(() => {});
  completionRef.current = () => {
    if (mode === 'work') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      const goingToLongBreak = newSessions % 4 === 0;
      const dur = goingToLongBreak ? longBreakMinutes * 60 : breakMinutes * 60;
      if (!muteAlert) playBreakSound();
      setIsLongBreak(goingToLongBreak);
      setMode('break');
      setTime(dur);
      setTotalTime(dur);
    } else {
      // Break ending → back to work
      if (!muteAlert) {
        if (isLongBreak) {
          playCycleCompleteSound();
        } else {
          playWorkSound();
        }
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

  // Show all 4 dots filled during a long break after completing 4 sessions
  const sessionsInCycle = sessionsCompleted % 4;
  const dotsToShow = mode === 'break' && sessionsInCycle === 0 && sessionsCompleted > 0
    ? 4
    : sessionsInCycle;

  const modeLabel = mode === 'work' ? 'Focus' : isLongBreak ? 'Long' : 'Break';

  return (
    <ToolCardDnd
      title="Flow Timer"
      icon={GiTomato}
      onRemove={onRemove}
      dragHandleProps={dragHandleProps}
      isRecentlyDragged={isRecentlyDragged}
      canRemove={canRemove}
      additionalControls={<HelpButton onClick={() => setShowTips(true)} />}
    >
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
                strokeWidth="4"
              />
              <circle
                cx="105"
                cy="105"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
              />
            </ProgressRingSvg>
            <TimerDisplay>
              <TimerTime>{secondsToMinutes(time)}</TimerTime>
              <InnerModeLabel>{modeLabel}</InnerModeLabel>
              <InnerSessionDots>
                {[0, 1, 2, 3].map(i => (
                  <InnerDot key={i} $completed={i < dotsToShow} />
                ))}
              </InnerSessionDots>
            </TimerDisplay>
          </TimerWrapper>
        );
      })()}

      <TimerControls>
        <TimerButton
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={resetTimer}
          title="Reset timer"
        >
          <IconWrapper><Icon icon={FaUndo} size={20} /></IconWrapper>
        </TimerButton>

        <PlayPauseButton
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCountdown}
          title={isCounting ? "Pause" : "Play"}
        >
          <IconWrapper>
            {isCounting ? <Icon icon={FaPause} size={24} /> : <Icon icon={FaPlay} size={24} />}
          </IconWrapper>
        </PlayPauseButton>

        <TimerButton
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={mode === 'work' ? takeBreak : skipToWork}
          title={mode === 'work' ? "Take a break" : "Back to focus"}
        >
          <IconWrapper>
            <Icon icon={mode === 'work' ? FaCoffee : FaBriefcase} size={20} />
          </IconWrapper>
        </TimerButton>

        <TimerButton
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <IconWrapper><Icon icon={FaCog} size={20} /></IconWrapper>
        </TimerButton>
      </TimerControls>

      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <SettingsRow>
              <SettingsLabel>Focus</SettingsLabel>
              <SmallButton onClick={() => setWorkMinutes(Math.max(1, workMinutes - 1))} whileTap={{ scale: 0.9 }} title="Decrease focus time">
                <Icon icon={FaMinus} size={10} />
              </SmallButton>
              <SettingsValue>{workMinutes} min</SettingsValue>
              <SmallButton onClick={() => setWorkMinutes(Math.min(60, workMinutes + 1))} whileTap={{ scale: 0.9 }} title="Increase focus time">
                <Icon icon={FaPlus} size={10} />
              </SmallButton>
            </SettingsRow>

            <SettingsRow>
              <SettingsLabel>Break</SettingsLabel>
              <SmallButton onClick={() => setBreakMinutes(Math.max(1, breakMinutes - 1))} whileTap={{ scale: 0.9 }} title="Decrease break time">
                <Icon icon={FaMinus} size={10} />
              </SmallButton>
              <SettingsValue>{breakMinutes} min</SettingsValue>
              <SmallButton onClick={() => setBreakMinutes(Math.min(30, breakMinutes + 1))} whileTap={{ scale: 0.9 }} title="Increase break time">
                <Icon icon={FaPlus} size={10} />
              </SmallButton>
            </SettingsRow>

            <SettingsRow>
              <SettingsLabel>Long</SettingsLabel>
              <SmallButton onClick={() => setLongBreakMinutes(Math.max(2, longBreakMinutes - 1))} whileTap={{ scale: 0.9 }} title="Decrease long break time">
                <Icon icon={FaMinus} size={10} />
              </SmallButton>
              <SettingsValue>{longBreakMinutes} min</SettingsValue>
              <SmallButton onClick={() => setLongBreakMinutes(Math.min(60, longBreakMinutes + 1))} whileTap={{ scale: 0.9 }} title="Increase long break time">
                <Icon icon={FaPlus} size={10} />
              </SmallButton>
            </SettingsRow>

            <MuteRow onClick={() => setMuteAlert(!muteAlert)} title={muteAlert ? "Unmute alert" : "Mute alert"}>
              <IconWrapper>
                <Icon icon={muteAlert ? FaVolumeMute : FaVolumeUp} size={16} />
              </IconWrapper>
              <MuteLabel>{muteAlert ? 'Alert muted' : 'Alert sound on'}</MuteLabel>
            </MuteRow>
          </SettingsPanel>
        )}
      </AnimatePresence>

      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        title="How the Flow Timer Works"
        content={
          <>
            <p>
              This timer follows the Pomodoro technique.
            </p>
            <p>
              Work in focused intervals, then take a short break. After 4 sessions, a longer break is triggered automatically.
            </p>
            <p>
              The timer auto-transitions between focus and break periods. Use the gear icon to customize durations and mute the alert sound.
            </p>
          </>
        }
      />
    </ToolCardDnd>
  );
}
