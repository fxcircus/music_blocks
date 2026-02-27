import React, { useMemo } from 'react';
import styled from 'styled-components';
import { PianoVisualizerProps, PianoKey, getNoteChromatic } from '../types';

const PianoContainer = styled.div`
  display: flex;
  position: relative;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.sm};
  box-shadow: ${({ theme }) => theme.shadows.medium};
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
}>`
  width: 28px;
  height: 100px;
  background: ${({ $isHighlighted, $highlightType, theme }) => {
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
  transform: ${({ $isPlaying }) => $isPlaying ? 'scale(1, 0.98)' : 'scale(1, 1)'};
  box-shadow: ${({ $isPlaying, theme }) =>
    $isPlaying ? `0 0 10px ${theme.colors.primary}` : '0 2px 4px rgba(0,0,0,0.1)'};

  &:hover {
    background: ${({ $isHighlighted, $highlightType, theme }) => {
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
  $leftOffset: number;
}>`
  width: 20px;
  height: 65px;
  background: ${({ $isHighlighted, $highlightType, theme }) => {
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
  transform: ${({ $isPlaying }) => $isPlaying ? 'scale(1, 0.98)' : 'scale(1, 1)'};
  box-shadow: ${({ $isPlaying, theme }) =>
    $isPlaying ? `0 0 10px ${theme.colors.primary}` : '0 2px 6px rgba(0,0,0,0.3)'};

  &:hover {
    background: ${({ $isHighlighted, $highlightType, theme }) => {
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
    const startOctave = 4;

    // Create one octave of keys (C to B)
    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackNotePositions: Record<string, number> = {
      'C♯': 1, 'E♭': 3, 'F♯': 6, 'A♭': 8, 'B♭': 10
    };

    // Create white keys
    whiteNotes.forEach((note, index) => {
      const chromatic = getNoteChromatic(note);
      const isActive = activeNotes.some(n => getNoteChromatic(n) === chromatic);
      const noteIndex = activeNotes.findIndex(n => getNoteChromatic(n) === chromatic);

      keys.push({
        note,
        isBlack: false,
        position: chromatic,
        isHighlighted: isActive,
        highlightType: getHighlightType(noteIndex, highlightedNotes, rootNote, note),
        isPlaying: playingNoteIndex === noteIndex
      });
    });

    // Create black keys
    Object.entries(blackNotePositions).forEach(([note, position]) => {
      const chromatic = getNoteChromatic(note);
      const isActive = activeNotes.some(n => getNoteChromatic(n) === chromatic);
      const noteIndex = activeNotes.findIndex(n => getNoteChromatic(n) === chromatic);

      keys.push({
        note,
        isBlack: true,
        position: chromatic,
        isHighlighted: isActive,
        highlightType: getHighlightType(noteIndex, highlightedNotes, rootNote, note),
        isPlaying: playingNoteIndex === noteIndex
      });
    });

    return keys.sort((a, b) => a.position - b.position);
  }, [activeNotes, highlightedNotes, playingNoteIndex, rootNote, isSeventhMode]);

  // Calculate black key positions
  const blackKeyOffsets: Record<string, number> = {
    'C♯': 22,  // Between C and D
    'E♭': 52,  // Between D and E
    'F♯': 108, // Between F and G
    'A♭': 138, // Between G and A
    'B♭': 168  // Between A and B
  };

  const whiteKeys = pianoKeys.filter(key => !key.isBlack);
  const blackKeys = pianoKeys.filter(key => key.isBlack);

  return (
    <PianoContainer>
      <KeysContainer>
        {/* Render white keys */}
        {whiteKeys.map((key, index) => (
          <WhiteKey
            key={`white-${key.note}`}
            $isHighlighted={key.isHighlighted}
            $highlightType={key.highlightType}
            $isPlaying={key.isPlaying}
            title={key.note}
          />
        ))}

        {/* Render black keys */}
        {blackKeys.map((key) => (
          <BlackKey
            key={`black-${key.note}`}
            $isHighlighted={key.isHighlighted}
            $highlightType={key.highlightType}
            $isPlaying={key.isPlaying}
            $leftOffset={blackKeyOffsets[key.note] || 0}
            title={key.note}
          />
        ))}
      </KeysContainer>
    </PianoContainer>
  );
};

export default PianoVisualizer;