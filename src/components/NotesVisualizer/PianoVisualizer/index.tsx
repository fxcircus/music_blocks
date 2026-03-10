import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { PianoVisualizerProps, PianoKey, getNoteChromatic } from '../types';

// Inline SVG piano keyboard cursor (16x16, 3 white keys + 2 black keys)
const musicalNoteCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect x='1' y='1' width='14' height='14' rx='1.5' fill='%23f5f5f0' stroke='%23444' stroke-width='1'/%3E%3Cline x1='5.7' y1='1' x2='5.7' y2='15' stroke='%23bbb' stroke-width='0.5'/%3E%3Cline x1='10.3' y1='1' x2='10.3' y2='15' stroke='%23bbb' stroke-width='0.5'/%3E%3Crect x='4.2' y='1' width='3' height='8.5' rx='0.5' fill='%23333'/%3E%3Crect x='8.8' y='1' width='3' height='8.5' rx='0.5' fill='%23333'/%3E%3C/svg%3E") 8 15, pointer`;

const PianoContainer = styled.div`
  display: flex;
  position: relative;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.sm};
  overflow: hidden;
  min-height: 120px;
  touch-action: none;
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
    if ($isPressed || $isPlaying) return theme.colors.error;
    if (!$isHighlighted) return '#ffffff';
    switch ($highlightType) {
      case 'root': return theme.colors.secondary;
      case 'chord': return theme.colors.primary;
      case 'seventh': return theme.colors.primary;
      case 'scale': return theme.colors.primary;
      default: return '#ffffff';
    }
  }};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0 0 4px 4px;
  margin: 0 1px;
  position: relative;
  cursor: ${musicalNoteCursor};
  transition: background-color ${({ theme }) => theme.transitions.fast}, transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $isPlaying, $isPressed }) => ($isPlaying || $isPressed) ? 'scale(1, 0.98)' : 'scale(1, 1)'};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  user-select: none;

  &:hover {
    background: ${({ $isHighlighted, $highlightType, $isPlaying, $isPressed, theme }) => {
      if ($isPressed || $isPlaying) return theme.colors.error;
      if (!$isHighlighted) return '#f5f5f5';
      switch ($highlightType) {
        case 'root': return `${theme.colors.secondary}cc`;
        case 'chord': return `${theme.colors.primary}cc`;
        case 'seventh': return `${theme.colors.primary}cc`;
        case 'scale': return `${theme.colors.primary}cc`;
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
    if ($isPressed || $isPlaying) return theme.colors.error;
    if (!$isHighlighted) return '#2a2a2a';
    switch ($highlightType) {
      case 'root': return theme.colors.secondary;
      case 'chord': return theme.colors.primary;
      case 'seventh': return theme.colors.primary;
      case 'scale': return theme.colors.primary;
      default: return '#2a2a2a';
    }
  }};
  position: absolute;
  left: ${({ $leftOffset }) => $leftOffset}px;
  z-index: 2;
  border-radius: 0 0 3px 3px;
  cursor: ${musicalNoteCursor};
  transition: background-color ${({ theme }) => theme.transitions.fast}, transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $isPlaying, $isPressed }) => ($isPlaying || $isPressed) ? 'scale(1, 0.98)' : 'scale(1, 1)'};
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  user-select: none;

  &:hover {
    background: ${({ $isHighlighted, $highlightType, $isPlaying, $isPressed, theme }) => {
      if ($isPressed || $isPlaying) return theme.colors.error;
      if (!$isHighlighted) return '#3a3a3a';
      switch ($highlightType) {
        case 'root': return `${theme.colors.secondary}cc`;
        case 'chord': return `${theme.colors.primary}cc`;
        case 'seventh': return `${theme.colors.primary}cc`;
        case 'scale': return `${theme.colors.primary}cc`;
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
  // Visual state for pressed keys (triggers re-render)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Ref mirror of pressedKeys for synchronous checks in event handlers
  const pressedKeysRef = useRef<Set<string>>(new Set());

  // Dragging state for glissando
  const isDraggingRef = useRef(false);

  // Last key touched (for touch move detection)
  const lastTouchKeyRef = useRef<string | null>(null);

  // Audio context and oscillators management
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<Map<string, { oscillator: OscillatorNode; gain: GainNode }>>(new Map());

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
      const existing = activeOscillatorsRef.current.get(keyId);
      if (existing) {
        try { existing.oscillator.stop(); } catch {}
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

      // Store oscillator and gain for later release
      activeOscillatorsRef.current.set(keyId, { oscillator, gain: gainNode });
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }, [getAudioContext, calculateFrequency]);

  // Stop a note with fade-out
  const stopNote = useCallback((note: string, octave: number) => {
    try {
      const keyId = `${note}-${octave}`;
      const entry = activeOscillatorsRef.current.get(keyId);

      if (entry && audioContextRef.current) {
        const context = audioContextRef.current;
        const { oscillator, gain } = entry;

        // Fade out using the original gain node to avoid clicks
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

        oscillator.stop(context.currentTime + 0.1);
        activeOscillatorsRef.current.delete(keyId);
      }
    } catch (error) {
      console.error('Error stopping note:', error);
    }
  }, []);

  // Handle key press (by note name and raw octave)
  const handleKeyPress = useCallback((note: string, octave: number) => {
    const keyId = `${note}-${octave}`;
    if (pressedKeysRef.current.has(keyId)) return; // Already playing
    pressedKeysRef.current.add(keyId);
    setPressedKeys(new Set(pressedKeysRef.current));
    playNote(note, octave + 3); // Adjust octave for proper pitch
  }, [playNote]);

  // Handle key release (by note name and raw octave)
  const handleKeyRelease = useCallback((note: string, octave: number) => {
    const keyId = `${note}-${octave}`;
    if (!pressedKeysRef.current.has(keyId)) return; // Not playing
    pressedKeysRef.current.delete(keyId);
    setPressedKeys(new Set(pressedKeysRef.current));
    stopNote(note, octave + 3);
  }, [stopNote]);

  // Stop all currently pressed notes
  const stopAllNotes = useCallback(() => {
    pressedKeysRef.current.forEach(keyId => {
      const lastDash = keyId.lastIndexOf('-');
      const note = keyId.substring(0, lastDash);
      const octave = parseInt(keyId.substring(lastDash + 1), 10);
      stopNote(note, octave + 3);
    });
    pressedKeysRef.current.clear();
    setPressedKeys(new Set());
  }, [stopNote]);

  // Find key data from a DOM element at a given point (for touch)
  const getKeyFromPoint = useCallback((x: number, y: number): { note: string; octave: number } | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    const keyEl = el.closest('[data-note]') as HTMLElement | null;
    if (!keyEl?.dataset.note || keyEl.dataset.octave === undefined) return null;
    return { note: keyEl.dataset.note, octave: parseInt(keyEl.dataset.octave, 10) };
  }, []);

  // Container-level touch handlers for glissando + scroll prevention
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const touch = e.touches[0];
    const keyData = getKeyFromPoint(touch.clientX, touch.clientY);
    if (keyData) {
      handleKeyPress(keyData.note, keyData.octave);
      lastTouchKeyRef.current = `${keyData.note}-${keyData.octave}`;
    }
  }, [getKeyFromPoint, handleKeyPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const keyData = getKeyFromPoint(touch.clientX, touch.clientY);
    const newKeyId = keyData ? `${keyData.note}-${keyData.octave}` : null;

    if (newKeyId !== lastTouchKeyRef.current) {
      // Release the previous key
      if (lastTouchKeyRef.current) {
        const lastDash = lastTouchKeyRef.current.lastIndexOf('-');
        const prevNote = lastTouchKeyRef.current.substring(0, lastDash);
        const prevOctave = parseInt(lastTouchKeyRef.current.substring(lastDash + 1), 10);
        handleKeyRelease(prevNote, prevOctave);
      }
      // Press the new key
      if (keyData) {
        handleKeyPress(keyData.note, keyData.octave);
      }
      lastTouchKeyRef.current = newKeyId;
    }
  }, [getKeyFromPoint, handleKeyPress, handleKeyRelease]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isDraggingRef.current = false;
    lastTouchKeyRef.current = null;
    stopAllNotes();
  }, [stopAllNotes]);

  // Global mouseup listener to catch releases outside the piano
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        stopAllNotes();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [stopAllNotes]);

  // Cleanup oscillators on unmount
  useEffect(() => {
    const oscillators = activeOscillatorsRef.current;
    return () => {
      oscillators.forEach(entry => {
        try { entry.oscillator.stop(); } catch {}
      });
      oscillators.clear();
    };
  }, []);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <PianoContainer
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <KeysContainer>
        {/* Render white keys */}
        {whiteKeys.map((key, index) => {
          const octave = Math.floor(key.position / 12);
          const keyId = `${key.note}-${octave}`;
          const isPressed = pressedKeys.has(keyId);

          return (
            <WhiteKey
              key={`white-${key.note}-${index}`}
              data-note={key.note}
              data-octave={octave}
              $isHighlighted={key.isHighlighted}
              $highlightType={key.highlightType}
              $isPlaying={key.isPlaying}
              $isPressed={isPressed}
              title={key.note}
              onMouseDown={() => {
                isDraggingRef.current = true;
                handleKeyPress(key.note, octave);
              }}
              onMouseUp={() => {
                isDraggingRef.current = false;
                handleKeyRelease(key.note, octave);
              }}
              onMouseEnter={() => {
                if (isDraggingRef.current) {
                  handleKeyPress(key.note, octave);
                }
              }}
              onMouseLeave={() => {
                handleKeyRelease(key.note, octave);
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
              data-note={key.note}
              data-octave={octave}
              $isHighlighted={key.isHighlighted}
              $highlightType={key.highlightType}
              $isPlaying={key.isPlaying}
              $isPressed={isPressed}
              $leftOffset={calculateBlackKeyOffset(key)}
              title={key.note}
              onMouseDown={(e) => {
                e.stopPropagation();
                isDraggingRef.current = true;
                handleKeyPress(key.note, octave);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                isDraggingRef.current = false;
                handleKeyRelease(key.note, octave);
              }}
              onMouseEnter={() => {
                if (isDraggingRef.current) {
                  handleKeyPress(key.note, octave);
                }
              }}
              onMouseLeave={() => {
                handleKeyRelease(key.note, octave);
              }}
            />
          );
        })}
      </KeysContainer>
    </PianoContainer>
  );
};

export default PianoVisualizer;
