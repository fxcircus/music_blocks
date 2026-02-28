import React, { useMemo, useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { PianoVisualizerProps, PianoKey, getNoteChromatic } from '../types';

const PianoContainer = styled.div`
  display: flex;
  position: relative;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.sm};
  overflow: hidden;
  min-height: 120px;
`;

const KeysContainer = styled.div`
  display: flex;
  position: relative;
  margin: 0 auto;
`;

const WhiteKey = styled.div<{
  $isHighlighted: boolean;
  $highlightType?: 'root' | 'chord' | 'seventh' | 'scale';
  $isPlaying?: boolean;
  $isPressed?: boolean;
}>`
  width: 28px;
  height: 100px;
  background: ${({ $isHighlighted, $highlightType, $isPlaying, $isPressed, theme }) => {
    if ($isPressed || $isPlaying) return '#dc2626';  // Solid red when pressed or playing
    if (!$isHighlighted) return '#ffffff';
    switch ($highlightType) {
      case 'root': return '#0088cc';  // Bright blue for root notes
      case 'chord': return '#8b5cf6';
      case 'seventh': return '#8b5cf6';
      case 'scale': return '#8b5cf6';
      default: return '#ffffff';
    }
  }};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0 0 4px 4px;
  margin: 0 1px;
  position: relative;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  transform: ${({ $isPlaying, $isPressed }) => ($isPlaying || $isPressed) ? 'scale(1, 0.98)' : 'scale(1, 1)'};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  user-select: none;

  &:hover {
    background: ${({ $isHighlighted, $highlightType, $isPlaying, $isPressed, theme }) => {
      if ($isPressed || $isPlaying) return '#dc2626';  // Stay red when pressed or playing
      if (!$isHighlighted) return '#f5f5f5';
      switch ($highlightType) {
        case 'root': return '#006699';  // Darker blue on hover for root
        case 'chord': return '#9b6cf6';
        case 'seventh': return '#9b6cf6';
        case 'scale': return '#9b6cf6';
        default: return '#f5f5f5';
      }
    }};
  }

  &::after {
    content: '${props => props.title || ''}';
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: ${({ $isHighlighted, theme }) =>
      $isHighlighted ? theme.colors.buttonText : theme.colors.textSecondary};
    font-weight: ${({ $highlightType }) =>
      $highlightType === 'root' ? 'bold' : 'normal'};
  }
`;

const BlackKey = styled.div<{
  $isHighlighted: boolean;
  $highlightType?: 'root' | 'chord' | 'seventh' | 'scale';
  $isPlaying?: boolean;
  $isPressed?: boolean;
  $leftOffset: number;
}>`
  width: 20px;
  height: 65px;
  background: ${({ $isHighlighted, $highlightType, $isPlaying, $isPressed, theme }) => {
    if ($isPressed || $isPlaying) return '#dc2626';  // Solid red when pressed or playing
    if (!$isHighlighted) return '#2a2a2a';
    switch ($highlightType) {
      case 'root': return '#0088cc';  // Bright blue for root notes (black keys)
      case 'chord': return '#8b5cf6';
      case 'seventh': return '#8b5cf6';
      case 'scale': return '#8b5cf6';
      default: return '#2a2a2a';
    }
  }};
  position: absolute;
  left: ${({ $leftOffset }) => $leftOffset}px;
  z-index: 2;
  border-radius: 0 0 3px 3px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  transform: ${({ $isPlaying, $isPressed }) => ($isPlaying || $isPressed) ? 'scale(1, 0.98)' : 'scale(1, 1)'};
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  user-select: none;

  &:hover {
    background: ${({ $isHighlighted, $highlightType, $isPlaying, $isPressed, theme }) => {
      if ($isPressed || $isPlaying) return '#dc2626';  // Stay red when pressed or playing
      if (!$isHighlighted) return '#3a3a3a';
      switch ($highlightType) {
        case 'root': return '#006699';  // Darker blue on hover for root (black keys)
        case 'chord': return '#9b6cf6';
        case 'seventh': return '#9b6cf6';
        case 'scale': return '#9b6cf6';
        default: return '#3a3a3a';
      }
    }};
  }

  &::after {
    content: '${props => props.title || ''}';
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    color: ${({ $isHighlighted }) =>
      $isHighlighted ? '#ffffff' : '#888888'};
    font-weight: ${({ $highlightType }) =>
      $highlightType === 'root' ? 'bold' : 'normal'};
  }
`;

const PianoVisualizer: React.FC<PianoVisualizerProps> = ({
  activeNotes,
  highlightedNotes,
  playingNoteIndex,
  rootNote,
  isSeventhMode,
  selectedChord
}) => {
  // State to track which keys are currently pressed
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Audio context and oscillators management
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map());

  // Initialize audio context lazily
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Calculate frequency for a given note
  const calculateFrequency = useCallback((note: string, octave: number): number => {
    const noteFrequencies: Record<string, number> = {
      'C': 261.63,
      'C♯': 277.18, 'D♭': 277.18,
      'D': 293.66,
      'D♯': 311.13, 'E♭': 311.13,
      'E': 329.63,
      'F': 349.23,
      'F♯': 369.99, 'G♭': 369.99,
      'G': 392.00,
      'G♯': 415.30, 'A♭': 415.30,
      'A': 440.00,
      'A♯': 466.16, 'B♭': 466.16,
      'B': 493.88
    };

    const baseFreq = noteFrequencies[note] || 261.63; // Default to C if not found
    return baseFreq * Math.pow(2, octave - 4); // Adjust for octave (C4 = middle C)
  }, []);

  // Play a note
  const playNote = useCallback((note: string, octave: number) => {
    try {
      const context = getAudioContext();

      // Resume context if suspended
      if (context.state === 'suspended') {
        context.resume();
      }

      const frequency = calculateFrequency(note, octave);
      const keyId = `${note}-${octave}`;

      // Stop any existing oscillator for this key
      const existingOsc = activeOscillatorsRef.current.get(keyId);
      if (existingOsc) {
        existingOsc.stop();
        activeOscillatorsRef.current.delete(keyId);
      }

      // Create new oscillator
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.frequency.value = frequency;
      oscillator.type = 'triangle'; // Softer sound than sine

      // Set up gain envelope for smoother sound
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.1); // Sustain

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Start playing
      oscillator.start(context.currentTime);

      // Store the oscillator
      activeOscillatorsRef.current.set(keyId, oscillator);
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }, [getAudioContext, calculateFrequency]);

  // Stop a note
  const stopNote = useCallback((note: string, octave: number) => {
    try {
      const keyId = `${note}-${octave}`;
      const oscillator = activeOscillatorsRef.current.get(keyId);

      if (oscillator && audioContextRef.current) {
        const context = audioContextRef.current;
        const gainNode = context.createGain();

        // Quick fade out to avoid clicks
        gainNode.gain.setValueAtTime(0.15, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

        oscillator.stop(context.currentTime + 0.1);
        activeOscillatorsRef.current.delete(keyId);
      }
    } catch (error) {
      console.error('Error stopping note:', error);
    }
  }, []);

  // Handle key press
  const handleKeyPress = useCallback((key: PianoKey, octave: number) => {
    const keyId = `${key.note}-${octave}`;
    setPressedKeys(prev => new Set([...prev, keyId]));
    playNote(key.note, octave + 3); // Adjust octave for proper pitch
  }, [playNote]);

  // Handle key release
  const handleKeyRelease = useCallback((key: PianoKey, octave: number) => {
    const keyId = `${key.note}-${octave}`;
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(keyId);
      return newSet;
    });
    stopNote(key.note, octave + 3);
  }, [stopNote]);
  // Helper function to determine highlight type
  const getHighlightType = (
    noteIndex: number,
    highlightedNotes: Set<number>,
    rootNote: string,
    currentNote: string
  ): 'root' | 'chord' | 'seventh' | 'scale' | undefined => {
    if (noteIndex === -1) return undefined;

    // Only show notes that are in highlightedNotes
    if (!highlightedNotes.has(noteIndex)) {
      return undefined;
    }

    // If a chord is selected
    if (selectedChord !== null) {
      // Check if it's the root note of the selected chord
      if (noteIndex === selectedChord) {
        return 'root';
      }

      // Determine if it's the seventh
      const highlightedArray = Array.from(highlightedNotes);
      if (isSeventhMode && highlightedNotes.size === 4 && noteIndex === highlightedArray[3]) {
        return 'seventh';
      }

      return 'chord';
    } else {
      // No chord selected - show all scale notes
      // Check if it's the root note of the scale
      if (getNoteChromatic(currentNote) === getNoteChromatic(rootNote)) {
        return 'root';
      }

      return 'scale';
    }
  };

  const pianoKeys = useMemo(() => {
    const keys: PianoKey[] = [];

    // Create 2 octaves of keys
    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackNotePositions: Record<string, number> = {
      'C♯': 1, 'E♭': 3, 'F♯': 6, 'A♭': 8, 'B♭': 10
    };

    // Find the chromatic position of the root note
    const rootChromatic = getNoteChromatic(rootNote);

    // Determine which octave to start highlighting from
    // We want to show the scale starting from the first occurrence of the root
    let scaleStartOctave = 0;
    if (rootChromatic > 0) { // If root is not C, we might need to start from octave 0
      scaleStartOctave = 0;
    }

    // Create 2 octaves worth of keys
    for (let octave = 0; octave < 2; octave++) {
      // Create white keys for this octave
      whiteNotes.forEach((note) => {
        const chromatic = getNoteChromatic(note);
        const absolutePosition = chromatic + (octave * 12);

        // Check if this note should be highlighted
        let isActive = false;
        let noteIndex = -1;

        // Find if this note is part of our scale
        const scaleIndex = activeNotes.findIndex(n => getNoteChromatic(n) === chromatic);

        if (scaleIndex !== -1) {
          // We highlight notes in a single octave span starting from the first occurrence of the root
          if (octave === 0 && chromatic >= rootChromatic) {
            // First octave, notes from root onwards
            isActive = true;
            noteIndex = scaleIndex;
          } else if (octave === 1 && chromatic < rootChromatic) {
            // Second octave, notes before the root (completing the octave span)
            isActive = true;
            noteIndex = scaleIndex;
          } else if (octave === 1 && chromatic === rootChromatic && scaleIndex === 0) {
            // The root note in the second octave (completing the scale)
            isActive = true;
            noteIndex = scaleIndex;
          }
        }

        keys.push({
          note,
          isBlack: false,
          position: absolutePosition,
          isHighlighted: isActive,
          highlightType: getHighlightType(noteIndex, highlightedNotes, rootNote, note),
          isPlaying: playingNoteIndex !== undefined && playingNoteIndex >= 0 && playingNoteIndex === noteIndex && isActive
        });
      });

      // Create black keys for this octave
      Object.entries(blackNotePositions).forEach(([note, position]) => {
        const chromatic = getNoteChromatic(note);
        const absolutePosition = chromatic + (octave * 12);

        // Check if this note should be highlighted
        let isActive = false;
        let noteIndex = -1;

        // Find if this note is part of our scale
        const scaleIndex = activeNotes.findIndex(n => getNoteChromatic(n) === chromatic);

        if (scaleIndex !== -1) {
          // We highlight notes in a single octave span starting from the first occurrence of the root
          if (octave === 0 && chromatic >= rootChromatic) {
            // First octave, notes from root onwards
            isActive = true;
            noteIndex = scaleIndex;
          } else if (octave === 1 && chromatic < rootChromatic) {
            // Second octave, notes before the root (completing the octave span)
            isActive = true;
            noteIndex = scaleIndex;
          }
        }

        keys.push({
          note,
          isBlack: true,
          position: absolutePosition,
          isHighlighted: isActive,
          highlightType: getHighlightType(noteIndex, highlightedNotes, rootNote, note),
          isPlaying: playingNoteIndex !== undefined && playingNoteIndex >= 0 && playingNoteIndex === noteIndex && isActive
        });
      });
    }

    return keys.sort((a, b) => a.position - b.position);
  }, [activeNotes, highlightedNotes, playingNoteIndex, rootNote, isSeventhMode, selectedChord]);

  // Calculate black key positions for 2 octaves
  // Each white key is 28px + 2px margin = 30px total
  const whiteKeyTotalWidth = 30;

  // Base offsets for black keys within one octave
  const baseBlackKeyOffsets: Record<string, number> = {
    'C♯': 22,  // Between C and D
    'E♭': 52,  // Between D and E
    'F♯': 108, // Between F and G
    'A♭': 138, // Between G and A
    'B♭': 168  // Between A and B
  };

  // Calculate the actual offset for each black key based on its octave
  const calculateBlackKeyOffset = (key: PianoKey): number => {
    const octaveOffset = Math.floor(key.position / 12) * 7 * whiteKeyTotalWidth;
    return (baseBlackKeyOffsets[key.note] || 0) + octaveOffset;
  };

  const whiteKeys = pianoKeys.filter(key => !key.isBlack);
  const blackKeys = pianoKeys.filter(key => key.isBlack);

  return (
    <PianoContainer>
      <KeysContainer>
        {/* Render white keys */}
        {whiteKeys.map((key, index) => {
          const octave = Math.floor(key.position / 12);
          const keyId = `${key.note}-${octave}`;
          const isPressed = pressedKeys.has(keyId);

          return (
            <WhiteKey
              key={`white-${key.note}-${index}`}
              $isHighlighted={key.isHighlighted}
              $highlightType={key.highlightType}
              $isPlaying={key.isPlaying}
              $isPressed={isPressed}
              title={key.note}
              onMouseDown={() => handleKeyPress(key, octave)}
              onMouseUp={() => handleKeyRelease(key, octave)}
              onMouseLeave={() => {
                // Also release on mouse leave to prevent stuck notes
                if (isPressed) {
                  handleKeyRelease(key, octave);
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                handleKeyPress(key, octave);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleKeyRelease(key, octave);
              }}
            />
          );
        })}

        {/* Render black keys */}
        {blackKeys.map((key, index) => {
          const octave = Math.floor(key.position / 12);
          const keyId = `${key.note}-${octave}`;
          const isPressed = pressedKeys.has(keyId);

          return (
            <BlackKey
              key={`black-${key.note}-${index}`}
              $isHighlighted={key.isHighlighted}
              $highlightType={key.highlightType}
              $isPlaying={key.isPlaying}
              $isPressed={isPressed}
              $leftOffset={calculateBlackKeyOffset(key)}
              title={key.note}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleKeyPress(key, octave);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                handleKeyRelease(key, octave);
              }}
              onMouseLeave={() => {
                // Also release on mouse leave to prevent stuck notes
                if (isPressed) {
                  handleKeyRelease(key, octave);
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleKeyPress(key, octave);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleKeyRelease(key, octave);
              }}
            />
          );
        })}
      </KeysContainer>
    </PianoContainer>
  );
};

export default PianoVisualizer;