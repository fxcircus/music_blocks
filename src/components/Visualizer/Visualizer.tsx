import React, { FC, useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause, FaRandom } from 'react-icons/fa';
import * as Tone from 'tone';
import { Icon } from '../../utils/IconHelper';

interface VisualizerProps {
  scale: string[];
  bpm: number;
}

const VisualizerCard = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: ${({ theme }) => theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
  margin-top: ${({ theme }) => theme.spacing.xl};
  overflow: hidden;
`;

const VisualizerTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const VisualizerCanvas = styled.div`
  width: 100%;
  height: 180px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;
  overflow: hidden;
`;

const WaveContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Bar = styled(motion.div)<{ index: number; total: number; isActive: boolean }>`
  width: 6px;
  background: ${({ theme, isActive }) => 
    isActive 
      ? theme.colors.accentGradient
      : theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  margin: 0 4px;
  transform-origin: bottom;
`;

const ControlsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
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

const PlayButton = styled(ControlButton)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.buttonText};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.small};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const NoteInfo = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin-top: ${({ theme }) => theme.spacing.sm};
  font-weight: 500;
`;

const ScaleDisplay = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

const ScaleNote = styled(motion.div)<{ isActive: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background-color: ${({ theme, isActive }) => 
    isActive ? theme.colors.primary : `${theme.colors.primary}22`};
  color: ${({ theme, isActive }) => 
    isActive ? theme.colors.buttonText : theme.colors.text};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-weight: 500;
  min-width: 40px;
  text-align: center;
`;

const Visualizer: FC<VisualizerProps> = ({ scale, bpm }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState(-1);
  const [barHeights, setBarHeights] = useState<number[]>([]);
  const sequenceRef = useRef<any>(null);
  const synthRef = useRef<Tone.Synth | null>(null);
  
  // Generate random bar heights for visualization
  useEffect(() => {
    const generateRandomHeights = () => {
      return Array.from({ length: 30 }, () => Math.random() * 100 + 20);
    };
    
    setBarHeights(generateRandomHeights());
  }, []);
  
  // Setup Tone.js
  useEffect(() => {
    // Create a synth
    synthRef.current = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    }).toDestination();
    
    // Set volume
    if (synthRef.current) {
      synthRef.current.volume.value = -10;
    }
    
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
    };
  }, []);
  
  // Setup sequence when scale or bpm changes
  useEffect(() => {
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }
    
    const noteLength = '8n';
    const noteIndexes = scale.map((_, index) => index);
    
    sequenceRef.current = new Tone.Sequence(
      (time, noteIndex) => {
        if (synthRef.current && typeof noteIndex === 'number') {
          const octave = noteIndex > 7 ? 5 : 4;
          const note = `${scale[noteIndex % scale.length]}${octave}`;
          synthRef.current.triggerAttackRelease(note, noteLength, time);
          
          // Update active note for visualization
          Tone.Draw.schedule(() => {
            setActiveNoteIndex(noteIndex % scale.length);
            
            // Generate new random heights for visual interest
            setBarHeights(prev => {
              const newHeights = [...prev];
              newHeights[Math.floor(Math.random() * newHeights.length)] = 
                Math.random() * 100 + 20;
              return newHeights;
            });
          }, time);
        }
      },
      noteIndexes,
      noteLength
    );
    
    // Set the BPM
    Tone.Transport.bpm.value = bpm;
    
    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
    };
  }, [scale, bpm]);
  
  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      Tone.start();
      Tone.Transport.start();
      if (sequenceRef.current) {
        sequenceRef.current.start(0);
      }
    } else {
      Tone.Transport.pause();
      setActiveNoteIndex(-1);
    }
    
    return () => {
      Tone.Transport.pause();
    };
  }, [isPlaying]);
  
  const togglePlay = async () => {
    await Tone.start();
    setIsPlaying(!isPlaying);
  };
  
  const randomizePattern = () => {
    // Generate new random heights
    setBarHeights(Array.from({ length: 30 }, () => Math.random() * 100 + 20));
  };
  
  return (
    <VisualizerCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <VisualizerTitle>
        <IconWrapper>
          {isPlaying ? <Icon icon={FaPlay} size={18} /> : <Icon icon={FaPause} size={18} />}
        </IconWrapper>
        Audio Visualizer
      </VisualizerTitle>
      
      <VisualizerCanvas>
        <WaveContainer>
          <AnimatePresence>
            {barHeights.map((height, index) => (
              <Bar
                key={index}
                index={index}
                total={barHeights.length}
                isActive={index % scale.length === activeNoteIndex}
                initial={{ height: 20 }}
                animate={{ 
                  height: isPlaying 
                    ? index % scale.length === activeNoteIndex 
                      ? height + 30 
                      : height 
                    : height,
                  opacity: isPlaying ? 1 : 0.7
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 10, 
                  duration: 0.3 
                }}
              />
            ))}
          </AnimatePresence>
        </WaveContainer>
      </VisualizerCanvas>
      
      <ScaleDisplay>
        {scale.map((note, index) => (
          <ScaleNote 
            key={index}
            isActive={index === activeNoteIndex}
            animate={{ 
              scale: index === activeNoteIndex ? 1.2 : 1,
              y: index === activeNoteIndex ? -5 : 0
            }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {note}
          </ScaleNote>
        ))}
      </ScaleDisplay>
      
      <NoteInfo>
        {activeNoteIndex >= 0 ? `Playing: ${scale[activeNoteIndex]}` : 'Ready to play'}
      </NoteInfo>
      
      <ControlsRow>
        <PlayButton 
          onClick={togglePlay}
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
        >
          <IconWrapper>
            {isPlaying ? <Icon icon={FaPause} size={24} /> : <Icon icon={FaPlay} size={24} />}
          </IconWrapper>
        </PlayButton>
        
        <ControlButton 
          onClick={randomizePattern}
          whileHover={{ scale: 1.2 }} 
          whileTap={{ scale: 0.9 }}
        >
          <IconWrapper>
            <Icon icon={FaRandom} size={24} />
          </IconWrapper>
        </ControlButton>
      </ControlsRow>
    </VisualizerCard>
  );
};

export default Visualizer; 