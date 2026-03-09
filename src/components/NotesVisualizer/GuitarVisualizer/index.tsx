import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { GuitarVisualizerProps, GuitarString, GuitarFret, getNoteChromatic, getChromaticNote, STANDARD_TUNING } from '../types';

const INLAY_FRETS = [3, 5, 7, 9];
const DOUBLE_INLAY_FRETS = [12];

// Base octaves per string after reversal (high E first, low E last)
const STRING_OCTAVES_REVERSED = [4, 3, 3, 3, 2, 2];

interface CAGEDPosition {
  name: string;
  startFret: number;
  endFret: number;
  index: number;
}

function computeCAGEDPositions(rootNote: string): CAGEDPosition[] {
  const rootChromatic = getNoteChromatic(rootNote);

  // Root fret on each anchor string (open string chromatic values: E=4, A=9, D=2)
  const rootOnLowE = (rootChromatic - 4 + 12) % 12;
  const rootOnA    = (rootChromatic - 9 + 12) % 12;
  const rootOnD    = (rootChromatic - 2 + 12) % 12;

  // Each CAGED shape anchors to a specific string's root note.
  // Some shapes (G, C) reach back behind the anchor fret.
  //
  // E shape: root on low E string, shape starts at root fret
  // D shape: root on D string, shape starts at root fret
  // C shape: root on A string, shape reaches 3 frets behind root
  // A shape: root on A string, shape starts at root fret
  // G shape: root on low E string, shape reaches 3 frets behind root
  const shapes = [
    { name: 'E shape', anchorFret: rootOnLowE, reachBack: 0 },
    { name: 'D shape', anchorFret: rootOnD,    reachBack: 0 },
    { name: 'C shape', anchorFret: rootOnA,    reachBack: 3 },
    { name: 'A shape', anchorFret: rootOnA,    reachBack: 0 },
    { name: 'G shape', anchorFret: rootOnLowE, reachBack: 3 },
  ];

  const positions = shapes.map(shape => {
    let startFret = shape.anchorFret - shape.reachBack;
    if (startFret < 0) startFret += 12;
    return {
      name: shape.name,
      startFret,
      endFret: Math.min(startFret + 4, 12),
      index: 0,
    };
  });

  positions.sort((a, b) => a.startFret - b.startFret);

  return positions
    .filter(p => p.startFret <= 12)
    .map((p, i) => ({ ...p, index: i + 1 }));
}

interface ChordVoicing {
  strings: (number | null)[]; // index 0=low E to 5=high E; number=fret, null=muted
}

function computeChordVoicing(
  chordTones: number[],
  chordRoot: number,
  startFret: number,
  endFret: number
): ChordVoicing {
  const tuningChromatic = [4, 9, 2, 7, 11, 4]; // E A D G B E

  // Step 1: Find candidate chord tones per string within fret window
  const candidatesPerString: { fret: number; chromatic: number }[][] = [];
  for (let s = 0; s < 6; s++) {
    const open = tuningChromatic[s];
    const candidates: { fret: number; chromatic: number }[] = [];
    for (let fret = startFret; fret <= endFret; fret++) {
      const note = (open + fret) % 12;
      if (chordTones.includes(note)) {
        candidates.push({ fret, chromatic: note });
      }
    }
    candidatesPerString.push(candidates);
  }

  // Step 2: Generate all possible voicings (each string: mute or play a candidate)
  const voicings: (number | null)[][] = [];
  function generate(si: number, current: (number | null)[]) {
    if (si === 6) { voicings.push([...current]); return; }
    current.push(null);
    generate(si + 1, current);
    current.pop();
    for (const c of candidatesPerString[si]) {
      current.push(c.fret);
      generate(si + 1, current);
      current.pop();
    }
  }
  generate(0, []);

  // Step 3: Filter to valid voicings
  const valid = voicings.filter(v => {
    const playedFrets = v.filter(f => f !== null && f !== 0) as number[];
    const playedNotes = v
      .map((fret, s) => fret !== null ? (tuningChromatic[s] + fret) % 12 : null)
      .filter(n => n !== null) as number[];
    if (playedNotes.length < 3) return false;
    for (const tone of chordTones) {
      if (!playedNotes.includes(tone)) return false;
    }
    if (playedFrets.length > 0) {
      if (Math.max(...playedFrets) - Math.min(...playedFrets) > 4) return false;
    }
    const playedIndices = v.map((f, i) => f !== null ? i : -1).filter(i => i !== -1);
    if (playedIndices.length > 0) {
      const min = Math.min(...playedIndices);
      const max = Math.max(...playedIndices);
      for (let i = min; i <= max; i++) {
        if (v[i] === null) return false;
      }
    }
    return true;
  });

  // Step 4: Score and pick the best
  const scored = valid.map(v => {
    let score = 0;
    const played = v
      .map((fret, s) => fret !== null ? { chromatic: (tuningChromatic[s] + fret) % 12, fret, string: s } : null)
      .filter(n => n !== null) as { chromatic: number; fret: number; string: number }[];

    if (played[0]?.chromatic === chordRoot) score += 50;
    score += played.length * 8;
    const fretted = played.filter(n => n.fret > 0);
    if (fretted.length > 0) {
      score -= (Math.max(...fretted.map(n => n.fret)) - Math.min(...fretted.map(n => n.fret))) * 5;
    }
    score += played.filter(n => n.fret === 0).length * 3;
    score -= fretted.length * 2;
    if (fretted.length > 0) {
      score -= (fretted.reduce((sum, n) => sum + n.fret, 0) / fretted.length) * 0.5;
    }
    return { voicing: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  if (scored.length > 0) return { strings: scored[0].voicing };
  return { strings: [null, null, null, null, null, null] };
}

const GuitarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  overflow-x: auto;
  min-height: 180px;
`;

const FretboardWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const NavButton = styled.button<{ $disabled?: boolean }>`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme, $disabled }) => $disabled ? `${theme.colors.textSecondary}44` : theme.colors.textSecondary};
  cursor: ${({ $disabled }) => $disabled ? 'default' : 'pointer'};
  font-size: 16px;
  transition: all ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  &:hover {
    background: ${({ theme, $disabled }) => $disabled ? 'transparent' : `${theme.colors.primary}22`};
  }
`;

const FretboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 350px;
`;

const StringRow = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  height: 25px;
  margin: 2px 0;
`;

const StringLine = styled.div`
  position: absolute;
  left: 40px;
  right: 0;
  height: 2px;
  background: ${({ theme }) => theme.colors.border};
  z-index: 0;
`;

const StringLabel = styled.div<{ $isMuted?: boolean }>`
  width: 30px;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: bold;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: ${({ $isMuted }) => $isMuted ? 0.3 : 1};
`;

const MutedMarker = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.5;
`;

const Fret = styled.div<{
  $isHighlighted: boolean;
  $highlightType?: 'root' | 'chord' | 'seventh' | 'scale';
  $isPlaying?: boolean;
  $isOpen?: boolean;
}>`
  width: ${({ $isOpen }) => $isOpen ? '35px' : '55px'};
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  margin: 0 1px;

  &::before {
    content: '';
    position: ${({ $isOpen }) => $isOpen ? 'static' : 'absolute'};
    right: 0;
    top: -10px;
    bottom: -10px;
    width: 2px;
    background: ${({ theme, $isOpen }) => $isOpen ? 'transparent' : theme.colors.border};
    opacity: 0.5;
  }
`;

const FretDot = styled.div<{
  $isHighlighted: boolean;
  $highlightType?: 'root' | 'chord' | 'seventh' | 'scale';
  $isPlaying?: boolean;
  $isPressed?: boolean;
}>`
  width: ${({ $isHighlighted }) => $isHighlighted ? '18px' : '0'};
  height: ${({ $isHighlighted }) => $isHighlighted ? '18px' : '0'};
  border-radius: 50%;
  background: ${({ $isHighlighted, $highlightType, $isPlaying, $isPressed, theme }) => {
    if ($isPressed || $isPlaying) return '#dc2626';
    if (!$isHighlighted) return 'transparent';
    switch ($highlightType) {
      case 'root': return '#0088cc';  // Bright blue for root notes
      case 'chord': return '#8b5cf6';  // Purple for other chord tones
      case 'seventh': return '#8b5cf6';
      case 'scale': return '#8b5cf6';  // Solid purple for scale notes
      default: return 'transparent';
    }
  }};
  border: none;
  display: ${({ $isHighlighted }) => $isHighlighted ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  cursor: ${({ $isHighlighted }) => $isHighlighted ? 'pointer' : 'default'};
  transition: all ${({ theme }) => theme.transitions.fast};
  transform: ${({ $isPlaying, $isPressed }) => ($isPlaying || $isPressed) ? 'scale(1.3)' : 'scale(1)'};
  box-shadow: ${({ $isPlaying, $isPressed, $isHighlighted, theme }) =>
    ($isPlaying || $isPressed) ? `0 0 10px #dc2626` :
    $isHighlighted ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'};
  font-size: 10px;
  color: ${({ $isHighlighted, theme }) =>
    $isHighlighted ? theme.colors.buttonText : theme.colors.textSecondary};
  font-weight: ${({ $highlightType }) =>
    $highlightType === 'root' ? 'bold' : 'normal'};
  user-select: none;

  &:hover {
    background: ${({ $isHighlighted, $highlightType, $isPlaying, $isPressed, theme }) => {
      if ($isPressed || $isPlaying) return '#dc2626';
      if (!$isHighlighted) return 'transparent';
      switch ($highlightType) {
        case 'root': return '#006699';  // Darker blue on hover for root
        case 'chord': return '#9b6cf6';  // Slightly lighter on hover
        case 'seventh': return '#9b6cf6';
        case 'scale': return '#9b6cf6';  // Solid purple on hover
        default: return 'transparent';
      }
    }};
  }
`;

const OpenString = styled.div<{
  $isHighlighted: boolean;
  $highlightType?: 'root' | 'chord' | 'seventh' | 'scale';
  $isPlaying?: boolean;
  $isPressed?: boolean;
}>`
  width: ${({ $isHighlighted }) => $isHighlighted ? '20px' : '0'};
  height: ${({ $isHighlighted }) => $isHighlighted ? '20px' : '0'};
  border-radius: 50%;
  border: ${({ $isHighlighted, $highlightType, $isPlaying, $isPressed, theme }) => {
    if (!$isHighlighted) return 'none';
    if ($isPressed || $isPlaying) return '2px solid #dc2626';
    switch ($highlightType) {
      case 'root': return `2px solid #0088cc`;  // Bright blue border for root
      case 'chord': return `2px solid #8b5cf6`;  // Purple for other chord tones
      case 'seventh': return `2px solid #8b5cf6`;
      case 'scale': return `2px solid #8b5cf6`;  // Solid purple border for scale notes
      default: return 'none';
    }
  }};
  background: transparent;
  display: ${({ $isHighlighted }) => $isHighlighted ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: ${({ $isHighlighted, $highlightType, $isPlaying, $isPressed, theme }) => {
    if (!$isHighlighted) return 'transparent';
    if ($isPressed || $isPlaying) return '#dc2626';
    switch ($highlightType) {
      case 'root': return '#0088cc';  // Bright blue text for root
      case 'chord': return '#8b5cf6';  // Purple for other chord tones
      case 'seventh': return '#8b5cf6';
      case 'scale': return '#8b5cf6';  // Solid purple for scale notes
      default: return theme.colors.textSecondary;
    }
  }};
  cursor: pointer;
  user-select: none;
  transform: ${({ $isPlaying, $isPressed }) => ($isPlaying || $isPressed) ? 'scale(1.2)' : 'scale(1)'};
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const FretNumbers = styled.div`
  display: flex;
  align-items: center;
  margin-left: 40px;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const FretNumber = styled.div<{ $isFirst?: boolean }>`
  width: ${({ $isFirst }) => $isFirst ? '35px' : '58px'};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  display: flex;
  justify-content: flex-end;

  span {
    transform: translateX(50%);
  }
`;

const NutMarker = styled.div`
  position: absolute;
  left: 72px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: ${({ theme }) => theme.colors.border};
  opacity: 0.8;
`;

const InlayOverlay = styled.div`
  position: absolute;
  left: 40px;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
`;

const InlayDot = styled.div<{ $top: string; $left: string }>`
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  transform: translate(-50%, -50%);
`;

const PositionIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const PositionDot = styled.div<{ $isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.textSecondary : `${theme.colors.textSecondary}44`};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const PositionLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-top: 2px;
`;

const GuitarVisualizer: React.FC<GuitarVisualizerProps> = ({
  activeNotes,
  highlightedNotes,
  playingNoteIndex,
  rootNote,
  isSeventhMode,
  selectedChord
}) => {
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const positions = useMemo(() => computeCAGEDPositions(rootNote), [rootNote]);

  // Audio context and oscillators management
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map());

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const calculateFrequency = useCallback((note: string, octave: number): number => {
    const noteFrequencies: Record<string, number> = {
      'C': 261.63, 'C♯': 277.18, 'D♭': 277.18,
      'D': 293.66, 'D♯': 311.13, 'E♭': 311.13,
      'E': 329.63, 'F': 349.23, 'F♯': 369.99, 'G♭': 369.99,
      'G': 392.00, 'G♯': 415.30, 'A♭': 415.30,
      'A': 440.00, 'A♯': 466.16, 'B♭': 466.16,
      'B': 493.88
    };
    const baseFreq = noteFrequencies[note] || 261.63;
    return baseFreq * Math.pow(2, octave - 4);
  }, []);

  const playNote = useCallback((note: string, octave: number, keyId: string) => {
    try {
      const context = getAudioContext();
      if (context.state === 'suspended') { context.resume(); }

      const frequency = calculateFrequency(note, octave);

      const existingOsc = activeOscillatorsRef.current.get(keyId);
      if (existingOsc) {
        existingOsc.stop();
        activeOscillatorsRef.current.delete(keyId);
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = 'triangle';
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(context.currentTime);
      activeOscillatorsRef.current.set(keyId, oscillator);
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }, [getAudioContext, calculateFrequency]);

  const stopNote = useCallback((keyId: string) => {
    try {
      const oscillator = activeOscillatorsRef.current.get(keyId);
      if (oscillator && audioContextRef.current) {
        oscillator.stop(audioContextRef.current.currentTime + 0.1);
        activeOscillatorsRef.current.delete(keyId);
      }
    } catch (error) {
      console.error('Error stopping note:', error);
    }
  }, []);

  const handleFretPress = useCallback((note: string, stringIndex: number, fretNumber: number) => {
    const openChromatic = getNoteChromatic(STANDARD_TUNING[5 - stringIndex]); // reversed order
    const octave = STRING_OCTAVES_REVERSED[stringIndex] + Math.floor((openChromatic + fretNumber) / 12);
    const keyId = `${stringIndex}-${fretNumber}`;
    setPressedKeys(prev => new Set([...prev, keyId]));
    playNote(note, octave, keyId);
  }, [playNote]);

  const handleFretRelease = useCallback((stringIndex: number, fretNumber: number) => {
    const keyId = `${stringIndex}-${fretNumber}`;
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(keyId);
      return newSet;
    });
    stopNote(keyId);
  }, [stopNote]);

  // Reset to position 0 when root note changes
  useEffect(() => {
    setCurrentPositionIndex(0);
  }, [rootNote]);

  const currentPosition = positions[currentPositionIndex] || positions[0];

  // Build visible fret range from current position
  const visibleFretRange = useMemo(() => {
    const range: number[] = [];
    for (let i = currentPosition.startFret; i <= currentPosition.endFret; i++) {
      range.push(i);
    }
    return range;
  }, [currentPosition]);

  const showNut = currentPosition.startFret === 0;

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

  // Compute single playable chord voicing when a chord is selected
  const chordVoicing = useMemo(() => {
    if (selectedChord === null) return null;
    const chordTones = Array.from(highlightedNotes)
      .map(idx => getNoteChromatic(activeNotes[idx]));
    const chordRoot = getNoteChromatic(activeNotes[selectedChord]);
    return computeChordVoicing(chordTones, chordRoot,
      currentPosition.startFret, currentPosition.endFret);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChord, highlightedNotes, activeNotes, currentPosition]);

  const fretboard = useMemo(() => {
    const strings: GuitarString[] = [];

    STANDARD_TUNING.forEach((openNote, stringIndex) => {
      const frets: GuitarFret[] = [];
      const openChromatic = getNoteChromatic(openNote);

      // Generate frets 0-12
      for (let fretNum = 0; fretNum <= 12; fretNum++) {
        const chromaticPosition = (openChromatic + fretNum) % 12;
        const fretNote = getChromaticNote(chromaticPosition);

        // Check if this note is in our active notes
        let isActive = activeNotes.some(n => getNoteChromatic(n) === chromaticPosition);
        const noteIndex = activeNotes.findIndex(n => getNoteChromatic(n) === chromaticPosition);
        let highlightType = getHighlightType(noteIndex, highlightedNotes, rootNote, fretNote);

        // Override for chord voicing: only show the single best voicing
        if (selectedChord !== null && chordVoicing && chordVoicing.strings.some(f => f !== null)) {
          const voicingFret = chordVoicing.strings[stringIndex];
          if (voicingFret === fretNum) {
            isActive = true;
            const chordRootChromatic = getNoteChromatic(activeNotes[selectedChord]);
            highlightType = chromaticPosition === chordRootChromatic ? 'root' : 'chord';
          } else {
            isActive = false;
            highlightType = undefined;
          }
        }

        frets.push({
          note: fretNote,
          fretNumber: fretNum,
          isHighlighted: isActive,
          highlightType,
          isPlaying: playingNoteIndex === noteIndex,
          isScaleRoot: getNoteChromatic(fretNote) === getNoteChromatic(rootNote)
        });
      }

      strings.push({
        openNote,
        frets
      });
    });

    // Reverse so low E is at bottom (like looking at a guitar)
    return strings.reverse();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNotes, highlightedNotes, playingNoteIndex, rootNote, selectedChord, chordVoicing]);

  const isFirstPosition = currentPositionIndex === 0;
  const isLastPosition = currentPositionIndex === positions.length - 1;

  return (
    <GuitarContainer>
      <FretboardWrapper>
        <NavButton
          $disabled={isFirstPosition}
          onClick={() => !isFirstPosition && setCurrentPositionIndex(currentPositionIndex - 1)}
        >
          ‹
        </NavButton>

        <FretboardContainer>
          <FretNumbers>
            {visibleFretRange.map((fretNum, i) => (
              <FretNumber key={fretNum} $isFirst={i === 0 && fretNum === 0}>
                <span>{fretNum}</span>
              </FretNumber>
            ))}
          </FretNumbers>
          {showNut && <NutMarker />}
          <div style={{ position: 'relative' }}>
          {fretboard.map((string, stringIndex) => {
            const visibleFrets = string.frets.filter(
              f => f.fretNumber >= currentPosition.startFret &&
                   f.fretNumber <= currentPosition.endFret
            );
            const voicingStringIndex = 5 - stringIndex; // render is reversed
            const isMuted = !!(selectedChord !== null && chordVoicing
              && chordVoicing.strings.some(f => f !== null)
              && chordVoicing.strings[voicingStringIndex] === null);

            return (
              <StringRow key={`string-${stringIndex}`}>
                <StringLabel $isMuted={isMuted}>{string.openNote}</StringLabel>
                <StringLine />

                {visibleFrets.map((fret, fretIdx) => {
                  const keyId = `${stringIndex}-${fret.fretNumber}`;
                  const isPressed = pressedKeys.has(keyId);
                  const showMutedX = isMuted && fretIdx === 0;

                  return (
                    <Fret
                      key={`fret-${fret.fretNumber}`}
                      $isHighlighted={fret.isHighlighted}
                      $highlightType={fret.highlightType}
                      $isPlaying={fret.isPlaying}
                      $isOpen={fret.fretNumber === 0}
                    >
                      {showMutedX ? (
                        <MutedMarker>X</MutedMarker>
                      ) : fret.fretNumber === 0 ? (
                        <OpenString
                          $isHighlighted={fret.isHighlighted}
                          $highlightType={fret.highlightType}
                          $isPlaying={fret.isPlaying}
                          $isPressed={isPressed}
                          onMouseDown={() => fret.isHighlighted && handleFretPress(fret.note, stringIndex, fret.fretNumber)}
                          onMouseUp={() => fret.isHighlighted && handleFretRelease(stringIndex, fret.fretNumber)}
                          onMouseLeave={() => isPressed && handleFretRelease(stringIndex, fret.fretNumber)}
                          onTouchStart={(e) => { e.preventDefault(); fret.isHighlighted && handleFretPress(fret.note, stringIndex, fret.fretNumber); }}
                          onTouchEnd={(e) => { e.preventDefault(); fret.isHighlighted && handleFretRelease(stringIndex, fret.fretNumber); }}
                        >
                          {fret.isHighlighted ? 'O' : ''}
                        </OpenString>
                      ) : (
                        <FretDot
                          $isHighlighted={fret.isHighlighted}
                          $highlightType={fret.highlightType}
                          $isPlaying={fret.isPlaying}
                          $isPressed={isPressed}
                          onMouseDown={() => fret.isHighlighted && handleFretPress(fret.note, stringIndex, fret.fretNumber)}
                          onMouseUp={() => fret.isHighlighted && handleFretRelease(stringIndex, fret.fretNumber)}
                          onMouseLeave={() => isPressed && handleFretRelease(stringIndex, fret.fretNumber)}
                          onTouchStart={(e) => { e.preventDefault(); fret.isHighlighted && handleFretPress(fret.note, stringIndex, fret.fretNumber); }}
                          onTouchEnd={(e) => { e.preventDefault(); fret.isHighlighted && handleFretRelease(stringIndex, fret.fretNumber); }}
                        >
                          {/* Show "R" only when:
                              1. No chord selected and it's the scale root (blue)
                              2. Chord selected, it's the scale root, but not the chord root (purple) */}
                          {fret.isHighlighted && fret.isScaleRoot && (
                            (selectedChord === null && fret.highlightType === 'root') ||
                            (selectedChord !== null && fret.highlightType !== 'root')
                          ) ? 'R' : ''}
                        </FretDot>
                      )}
                    </Fret>
                  );
                })}
              </StringRow>
            );
          })}

          <InlayOverlay>
            {visibleFretRange.map((fretNum, i) => {
              if (!INLAY_FRETS.includes(fretNum) && !DOUBLE_INLAY_FRETS.includes(fretNum)) return null;
              // Each fret: open=37px, normal=57px (width + 2px margin)
              // StringLabel = 30px, offset from overlay left (overlay starts at 40px but StringLabel is outside)
              const fretWidths = visibleFretRange.map((_, idx) => idx === 0 && visibleFretRange[0] === 0 ? 37 : 57);
              let left = -10; // offset for label area difference
              for (let j = 0; j < i; j++) left += fretWidths[j];
              left += fretWidths[i] + fretWidths[i] / 2;
              const leftPx = `${left}px`;
              // StringRow = 25px height + 4px margin = 29px per string
              // Strings: 0=E, 1=B, 2=G, 3=D, 4=A, 5=E
              // Between G(2) and D(3): center = 2.5 * 29 + 12.5 = 85px
              const singleDotTop = `${2.5 * 29 + 12.5}px`;
              // Double dots: under B(1) and A(4)
              const bStringTop = `${1 * 29 + 14.5}px`;
              const aStringTop = `${4 * 29 + 14.5}px`;

              if (INLAY_FRETS.includes(fretNum)) {
                return <InlayDot key={fretNum} $top={singleDotTop} $left={leftPx} />;
              }
              if (DOUBLE_INLAY_FRETS.includes(fretNum)) {
                return (
                  <React.Fragment key={fretNum}>
                    <InlayDot $top={bStringTop} $left={leftPx} />
                    <InlayDot $top={aStringTop} $left={leftPx} />
                  </React.Fragment>
                );
              }
              return null;
            })}
          </InlayOverlay>
          </div>
        </FretboardContainer>

        <NavButton
          $disabled={isLastPosition}
          onClick={() => !isLastPosition && setCurrentPositionIndex(currentPositionIndex + 1)}
        >
          ›
        </NavButton>
      </FretboardWrapper>

      <PositionIndicator>
        {positions.map((pos, i) => (
          <PositionDot
            key={i}
            $isActive={i === currentPositionIndex}
            onClick={() => setCurrentPositionIndex(i)}
          />
        ))}
      </PositionIndicator>
      <PositionLabel>{currentPosition.name}</PositionLabel>
    </GuitarContainer>
  );
};

export default GuitarVisualizer;
