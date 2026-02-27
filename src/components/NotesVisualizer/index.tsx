import React, { useMemo } from 'react';
import styled from 'styled-components';
import PianoVisualizer from './PianoVisualizer';
import GuitarVisualizer from './GuitarVisualizer';
import { NotesVisualizerProps, getNoteChromatic } from './types';

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

const ToggleContainer = styled.div`
  display: grid;
  grid-template-columns: 30px 35px 120px 1fr;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

const SpacerDiv = styled.div`
  width: 30px;
`;

const IconDiv = styled.div`
  width: 35px;
  text-align: center;
`;

const VisualizerLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: left;
  padding-left: ${({ theme }) => theme.spacing.md};
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ToggleButton = styled.button<{ $isActive: boolean }>`
  flex: 1;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : 'transparent'};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.buttonText : theme.colors.textSecondary};
  border: 2px solid ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : theme.colors.border};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-weight: ${({ $isActive }) => $isActive ? 600 : 400};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover {
    background: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary : `${theme.colors.primary}22`};
    transform: scale(1.02);
  }
`;

const NotesVisualizer: React.FC<NotesVisualizerProps> = ({
  activeNotes,
  scaleNotes,
  selectedChord,
  root,
  scale,
  isSeventhMode,
  visualizerType,
  playingNoteIndex = -1
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

  // Local state for visualizer toggles - both hidden by default
  const [showPiano, setShowPiano] = React.useState(false);
  const [showGuitar, setShowGuitar] = React.useState(false);

  return (
    <VisualizerContainer>
      <ToggleContainer>
        <SpacerDiv />
        <IconDiv />
        <VisualizerLabel>Visualize</VisualizerLabel>
        <ButtonGroup>
          <ToggleButton
            $isActive={showPiano}
            onClick={() => setShowPiano(!showPiano)}
          >
            Piano
          </ToggleButton>
          <ToggleButton
            $isActive={showGuitar}
            onClick={() => setShowGuitar(!showGuitar)}
          >
            Guitar
          </ToggleButton>
        </ButtonGroup>
      </ToggleContainer>

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