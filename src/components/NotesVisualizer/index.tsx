import React, { useMemo } from 'react';
import styled from 'styled-components';
import PianoVisualizer from './PianoVisualizer';
import GuitarVisualizer from './GuitarVisualizer';
import ChordProgressions from './ChordProgressions';
import { NotesVisualizerProps } from './types';

const VisualizerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

const VisualizerSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const NotesVisualizer: React.FC<NotesVisualizerProps> = ({
  activeNotes,
  scaleNotes,
  selectedChord,
  root,
  scale,
  isSeventhMode,
  visualizerType,
  playingNoteIndex = -1,
  showPiano,
  showGuitar,
  showProgressions,
  bpm,
  scaleNoteCount,
  onSelectChord,
}) => {
  // Calculate which notes should be highlighted based on chord selection
  const highlightedNotes = useMemo(() => {
    const highlighted = new Set<number>();

    if (selectedChord !== null && selectedChord >= 0) {
      // Add root note
      highlighted.add(selectedChord);

      // Add third and fifth
      const noteCount = activeNotes.length;
      const thirdIndex = (selectedChord + 2) % noteCount;
      const fifthIndex = (selectedChord + 4) % noteCount;
      highlighted.add(thirdIndex);
      highlighted.add(fifthIndex);

      // Add seventh if in seventh mode
      if (isSeventhMode && noteCount >= 7) {
        const seventhIndex = (selectedChord + 6) % 7;
        highlighted.add(seventhIndex);
      }
    } else {
      // If no chord selected, highlight all scale notes
      activeNotes.forEach((_, index) => {
        highlighted.add(index);
      });
    }

    return highlighted;
  }, [selectedChord, activeNotes, isSeventhMode]);

  if (!showPiano && !showGuitar && !showProgressions) return null;

  return (
    <VisualizerContainer>
      {showProgressions && (
        <VisualizerSection>
          <ChordProgressions
            activeNotes={activeNotes}
            rootNote={root}
            scaleName={scale}
            isSeventhMode={isSeventhMode}
            selectedChord={selectedChord}
            bpm={bpm}
            scaleNoteCount={scaleNoteCount}
            onSelectChord={onSelectChord}
          />
        </VisualizerSection>
      )}

      {showPiano && (
        <VisualizerSection>
          <PianoVisualizer
            activeNotes={activeNotes}
            highlightedNotes={highlightedNotes}
            playingNoteIndex={playingNoteIndex}
            rootNote={root}
            isSeventhMode={isSeventhMode}
            selectedChord={selectedChord}
          />
        </VisualizerSection>
      )}

      {showGuitar && (
        <VisualizerSection>
          <GuitarVisualizer
            activeNotes={activeNotes}
            highlightedNotes={highlightedNotes}
            playingNoteIndex={playingNoteIndex}
            rootNote={root}
            isSeventhMode={isSeventhMode}
            selectedChord={selectedChord}
          />
        </VisualizerSection>
      )}
    </VisualizerContainer>
  );
};

export default NotesVisualizer;
