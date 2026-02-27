import React, { useState, useEffect, useRef } from "react";
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaUndo, FaPlay, FaPause, FaCoffee } from 'react-icons/fa';
import { GiTomato } from 'react-icons/gi';
import ToolCardDnd from '../common/ToolCardDnd';
import { Icon } from '../../utils/IconHelper';
import TipsModal from '../common/TipsModal';
import HelpButton from '../common/HelpButton';

// Styled components
const TimerDisplay = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.timerBackground};
  border: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.timer};
  font-weight: 700;
  height: 180px;
  width: 180px;
  margin: 0 auto;
  transition: all ${({ theme }) => theme.transitions.normal};
  cursor: pointer;
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
  const [isCounting, setIsCounting] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const secondsToMinutes = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
  }

  const resetTimer = (interval: number) => {
    setIsCounting(false);
    setTime(interval);
  }

  const takeBreak = () => {
    setTime(300);
  }

  const toggleCountdown = () => {
    setIsCounting(!isCounting);
  };

  useEffect(() => {
    if (isCounting) {
      intervalIdRef.current = setInterval(() => {
        if (time <= 0) {
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
          }
          setIsCounting(false);
        } else {
          setTime(prevTime => prevTime - 1);
        }
      }, 1000);
    } else if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [isCounting, time]);

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
      <TimerDisplay
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)' }}
        transition={{ type: 'spring', stiffness: 300 }}
        onClick={toggleCountdown}
        whileTap={{ scale: 0.95 }}
        aria-label={isCounting ? "Pause timer" : "Start timer"}
      >
        {secondsToMinutes(time)}
      </TimerDisplay>

      <TimerControls>
        <TimerButton 
          whileHover={{ scale: 1.2 }} 
          whileTap={{ scale: 0.9 }}
          onClick={() => resetTimer(1500)}
        >
          <IconWrapper><Icon icon={FaUndo} size={20} /></IconWrapper>
        </TimerButton>

        <PlayPauseButton 
          whileHover={{ scale: 1.2 }} 
          whileTap={{ scale: 0.9 }}
          onClick={toggleCountdown}
        >
          <IconWrapper>
            {isCounting ? <Icon icon={FaPause} size={24} /> : <Icon icon={FaPlay} size={24} />}
          </IconWrapper>
        </PlayPauseButton>

        <TimerButton 
          whileHover={{ scale: 1.2 }} 
          whileTap={{ scale: 0.9 }}
          onClick={takeBreak}
        >
          <IconWrapper><Icon icon={FaCoffee} size={20} /></IconWrapper>
        </TimerButton>
      </TimerControls>

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
              Work in focused intervals (typically 25 minutes), then take a short break.
            </p>
            <p>
              After several work sessions, take a longer break.
            </p>
            <p>
              Use the timer to structure focused deep work sessions.
            </p>
          </>
        }
      />
    </ToolCardDnd>
  );
}
