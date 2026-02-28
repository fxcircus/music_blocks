import React, { useMemo } from 'react';
import styled from 'styled-components';
import { GuitarVisualizerProps, GuitarString, GuitarFret, getNoteChromatic, getChromaticNote, STANDARD_TUNING } from '../types';

const GuitarContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  overflow-x: auto;
  min-height: 180px;
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

const StringLabel = styled.div`
  width: 30px;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: bold;
  color: ${({ theme }) => theme.colors.textSecondary};
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
}>`
  width: ${({ $isHighlighted }) => $isHighlighted ? '18px' : '0'};
  height: ${({ $isHighlighted }) => $isHighlighted ? '18px' : '0'};
  border-radius: 50%;
  background: ${({ $isHighlighted, $highlightType, theme }) => {
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
  transform: ${({ $isPlaying }) => $isPlaying ? 'scale(1.3)' : 'scale(1)'};
  box-shadow: ${({ $isPlaying, $isHighlighted, theme }) =>
    $isPlaying ? `0 0 10px ${theme.colors.primary}` :
    $isHighlighted ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'};
  font-size: 10px;
  color: ${({ $isHighlighted, theme }) =>
    $isHighlighted ? theme.colors.buttonText : theme.colors.textSecondary};
  font-weight: ${({ $highlightType }) =>
    $highlightType === 'root' ? 'bold' : 'normal'};

  &:hover {
    background: ${({ $isHighlighted, $highlightType, theme }) => {
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
}>`
  width: ${({ $isHighlighted }) => $isHighlighted ? '20px' : '0'};
  height: ${({ $isHighlighted }) => $isHighlighted ? '20px' : '0'};
  border-radius: 50%;
  border: ${({ $isHighlighted, $highlightType, theme }) => {
    if (!$isHighlighted) return 'none';
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
  color: ${({ $isHighlighted, $highlightType, theme }) => {
    if (!$isHighlighted) return 'transparent';
    switch ($highlightType) {
      case 'root': return '#0088cc';  // Bright blue text for root
      case 'chord': return '#8b5cf6';  // Purple for other chord tones
      case 'seventh': return '#8b5cf6';
      case 'scale': return '#8b5cf6';  // Solid purple for scale notes
      default: return theme.colors.textSecondary;
    }
  }};
  transform: ${({ $isPlaying }) => $isPlaying ? 'scale(1.2)' : 'scale(1)'};
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
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
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

const GuitarVisualizer: React.FC<GuitarVisualizerProps> = ({
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

  const fretboard = useMemo(() => {
    const strings: GuitarString[] = [];

    // Guitar string octaves (from low to high)
    const stringOctaves = [2, 2, 3, 3, 3, 4];

    STANDARD_TUNING.forEach((openNote, stringIndex) => {
      const frets: GuitarFret[] = [];
      const openChromatic = getNoteChromatic(openNote);

      // Generate frets 0-5
      for (let fretNum = 0; fretNum <= 5; fretNum++) {
        const chromaticPosition = (openChromatic + fretNum) % 12;
        const fretNote = getChromaticNote(chromaticPosition);

        // Check if this note is in our active notes
        const isActive = activeNotes.some(n => getNoteChromatic(n) === chromaticPosition);
        const noteIndex = activeNotes.findIndex(n => getNoteChromatic(n) === chromaticPosition);

        frets.push({
          note: fretNote,
          fretNumber: fretNum,
          isHighlighted: isActive,
          highlightType: getHighlightType(noteIndex, highlightedNotes, rootNote, fretNote),
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
  }, [activeNotes, highlightedNotes, playingNoteIndex, rootNote, isSeventhMode, selectedChord]);

  return (
    <GuitarContainer>
      <FretNumbers>
        <FretNumber $isFirst>0</FretNumber>
        <FretNumber>1</FretNumber>
        <FretNumber>2</FretNumber>
        <FretNumber>3</FretNumber>
        <FretNumber>4</FretNumber>
        <FretNumber>5</FretNumber>
      </FretNumbers>

      <FretboardContainer>
        <NutMarker />
        {fretboard.map((string, stringIndex) => (
          <StringRow key={`string-${stringIndex}`}>
            <StringLabel>{string.openNote}</StringLabel>
            <StringLine />

            {string.frets.map((fret, fretIndex) => (
              <Fret
                key={`fret-${fretIndex}`}
                $isHighlighted={fret.isHighlighted}
                $highlightType={fret.highlightType}
                $isPlaying={fret.isPlaying}
                $isOpen={fret.fretNumber === 0}
              >
                {fret.fretNumber === 0 ? (
                  <OpenString
                    $isHighlighted={fret.isHighlighted}
                    $highlightType={fret.highlightType}
                    $isPlaying={fret.isPlaying}
                  >
                    {fret.isHighlighted ? 'O' : ''}
                  </OpenString>
                ) : (
                  <FretDot
                    $isHighlighted={fret.isHighlighted}
                    $highlightType={fret.highlightType}
                    $isPlaying={fret.isPlaying}
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
            ))}
          </StringRow>
        ))}
      </FretboardContainer>
    </GuitarContainer>
  );
};

export default GuitarVisualizer;