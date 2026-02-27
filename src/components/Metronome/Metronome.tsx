import React, { FC, useEffect, useState, useRef, useCallback } from "react";
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaVolumeMute, FaVolumeUp, FaPlay, FaPause, FaPlus, FaMinus, FaDrum, FaBug } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';
import ToolCard from '../common/ToolCard';
import TipsModal from '../common/TipsModal';
import HelpButton from '../common/HelpButton';
import config from '../../config';

interface LoaderProps {
    bpm: number;
    onRemove?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canRemove?: boolean;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}

const MetronomeDisplay = styled.div`
  width: 100%;
  position: relative;
  height: 120px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MetronomePendulum = styled(motion.div)`
  width: 4px;
  height: 90px;
  background: ${({ theme }) => theme.colors.accentGradient};
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

const MetronomeBase = styled(motion.div)`
  width: 200px;
  height: 25px;
  background: ${({ theme }) => theme.colors.accentGradient};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  position: absolute;
  bottom: 0;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  cursor: pointer;
`;

const BpmDisplay = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  min-width: 80px;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xs};
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.sm};
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
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
  transition: all ${({ theme }) => theme.transitions.fast};
  
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
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

// Metronome class
class MetronomeEngine {
  context: AudioContext | null = null;
  nextNoteTime: number = 0.0;
  scheduledNotes: { beat: number, time: number }[] = [];
  timerID: number | null = null;
  currentBeat: number = 0;
  beatsPerMeasure: number = 4;
  tempo: number = 120;
  running: boolean = false;
  muted: boolean = false;
  onBeatChange: ((beat: number) => void) | null = null;
  
  constructor(tempo: number, onBeatChange?: (beat: number) => void) {
    this.tempo = tempo;
    if (onBeatChange) {
      this.onBeatChange = onBeatChange;
    }
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
  
  private clearTimer() {
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }
  
  private playNote(time: number, isAccent: boolean) {
    if (this.muted || !this.context) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    if (isAccent) {
      osc.frequency.value = 880;
      gain.gain.value = 0.5;
    } else {
      osc.frequency.value = 440;
      gain.gain.value = 0.3;
    }
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gain.gain.value, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    osc.start(time);
    osc.stop(time + 0.15);
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
    
    // Play the note
    this.playNote(time, beatNumber === 0);
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
    onRemove,
    onMoveUp,
    onMoveDown,
    canRemove,
    canMoveUp,
    canMoveDown
}) => {
    // State
    const [metronomePlaying, setMetronomePlaying] = useState(false);
    const [muteSound, setMuteSound] = useState(false);
    const [bpm, setBpm] = useState(initialBpm);
    const [currentBeat, setCurrentBeat] = useState(0);
    const [showTips, setShowTips] = useState(false);
    const beats = [0, 1, 2, 3]; // 4/4 time signature
    
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
        
        // Initialize audio context
        metronomeRef.current.init();
        
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
    }, [bpm, debugLog]);
    
    // Update mute state in metronome engine
    useEffect(() => {
        if (metronomeRef.current) {
            debugLog(`Setting mute to ${muteSound}`);
            metronomeRef.current.setMuted(muteSound);
        }
    }, [muteSound, debugLog]);
    
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

    return (
        <ToolCard
            title="Metronome"
            icon={FaDrum}
            onRemove={onRemove}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            canRemove={canRemove}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
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
            
            <MetronomeDisplay>
                <MetronomeBase 
                    onClick={toggleMetronome}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                />
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
            </MetronomeDisplay>
            
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
                
                <BpmDisplay>{bpm}</BpmDisplay>
                
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
            
            <ControlsContainer>
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
                
                <ButtonGroup>
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
                </ButtonGroup>
            </ControlsContainer>
            
            <BeatsRow>
                {beats.map((beat) => (
                    <BeatIndicator 
                        key={beat}
                        animate={{ 
                            scale: currentBeat === beat && metronomePlaying ? [1, 1.5, 1] : 1,
                            backgroundColor: currentBeat === beat && metronomePlaying ? 
                                ['#6c63ff', '#5ee7df', '#6c63ff'] : '#6c63ff'
                        }}
                        transition={{ duration: 0.2 }}
                    />
                ))}
            </BeatsRow>
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
                            Use the + and – controls to adjust BPM.
                        </p>
                        <p>
                            The metronome will play at the currently displayed tempo.
                        </p>
                    </>
                }
            />
        </ToolCard>
    );
};

export default Metronome;
