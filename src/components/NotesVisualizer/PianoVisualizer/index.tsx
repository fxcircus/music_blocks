import React, { useMemo } from 'react';
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
}>`
  width: 28px;
  height: 100px;
  background: ${({ $isHighlighted, $highlightType, $isPlaying, theme }) => {
    if ($isPlaying) return '#dc2626';  // Solid red when playing
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    background: ${({ $isHighlighted, $highlightType, $isPlaying, theme }) => {
      if ($isPlaying) return '#dc2626';  // Stay red when playing
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
  background: ${({ $isHighlighted, $highlightType, $isPlaying, theme }) => {
    if ($isPlaying) return '#dc2626';  // Solid red when playing
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
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);

  &:hover {
    background: ${({ $isHighlighted, $highlightType, $isPlaying, theme }) => {
      if ($isPlaying) return '#dc2626';  // Stay red when playing
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
        {whiteKeys.map((key, index) => (
          <WhiteKey
            key={`white-${key.note}-${index}`}
            $isHighlighted={key.isHighlighted}
            $highlightType={key.highlightType}
            $isPlaying={key.isPlaying}
            title={key.note}
          />
        ))}

        {/* Render black keys */}
        {blackKeys.map((key, index) => (
          <BlackKey
            key={`black-${key.note}-${index}`}
            $isHighlighted={key.isHighlighted}
            $highlightType={key.highlightType}
            $isPlaying={key.isPlaying}
            $leftOffset={calculateBlackKeyOffset(key)}
            title={key.note}
          />
        ))}
      </KeysContainer>
    </PianoContainer>
  );
};

export default PianoVisualizer;