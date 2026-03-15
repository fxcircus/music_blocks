import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FaDownload } from 'react-icons/fa';
import { MdQueueMusic } from 'react-icons/md';
import { GiPianoKeys } from 'react-icons/gi';
import { FaCog } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';
import { scaleNoteCounts } from '../../utils/musicTheory';
import ChordProgressions from '../NotesVisualizer/ChordProgressions';
import TipsModal from '../common/TipsModal';

const BlockWrapper = styled.div`
  width: 100%;

  /* Override ChordProgressions Container to blend with ToolCard chrome */
  & > div {
    background: transparent;
    box-shadow: none;
    border-radius: 0;
    padding: ${({ theme }) => `${theme.spacing.xs} 0`};
  }
`;

interface ProgressionsBlockProps {
  generatorNotes: string[];
  generatorRoot: string;
  generatorScale: string;
  generatorBpm: string;
  generatorSelectedChord: number | null;
  generatorIsSeventhMode: boolean;
  savedProgressionIndex: number;
  onStateChange: (updates: Record<string, any>) => void;
  onSelectChord: (chord: number | null) => void;
  showTips?: boolean;
  setShowTips?: (show: boolean) => void;
}

const ProgressionsBlock: React.FC<ProgressionsBlockProps> = ({
  generatorNotes,
  generatorRoot,
  generatorScale,
  generatorBpm,
  generatorSelectedChord,
  generatorIsSeventhMode,
  savedProgressionIndex,
  onStateChange,
  onSelectChord,
  showTips: showTipsExternal,
  setShowTips: setShowTipsExternal,
}) => {
  const [showTipsInternal, setShowTipsInternal] = useState(false);
  const showTips = showTipsExternal !== undefined ? showTipsExternal : showTipsInternal;
  const setShowTips = setShowTipsExternal || setShowTipsInternal;

  const scaleNoteCount = scaleNoteCounts[generatorScale] || 7;

  const handleProgressionChange = useCallback((index: number) => {
    onStateChange({ savedProgressionIndex: index });
  }, [onStateChange]);

  return (
    <BlockWrapper>
      <ChordProgressions
        activeNotes={generatorNotes}
        rootNote={generatorRoot}
        scaleName={generatorScale}
        isSeventhMode={generatorIsSeventhMode}
        selectedChord={generatorSelectedChord}
        bpm={parseInt(generatorBpm) || 120}
        scaleNoteCount={scaleNoteCount}
        initialProgressionIndex={savedProgressionIndex}
        onSelectChord={onSelectChord}
        onProgressionChange={handleProgressionChange}
      />

      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        title="About Progressions"
        content={
          <>
            <p>
              <Icon icon={MdQueueMusic} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Browse <strong>66 named chord progressions</strong> across 8 genres (Pop, Rock, Jazz, Blues, Emotional, EDM, Classical, and custom utility patterns) using the dropdown selector. Each progression shows the chord degrees as colored pills that update to match your current key and scale.
            </p>
            <p>
              Click the <strong>dice button</strong> to pick a random progression — great for breaking out of familiar patterns and discovering new harmonic ideas.
            </p>
            <p>
              Hit the <strong>play button</strong> to hear all chords in the progression played in sequence at your current BPM. Click any individual <strong>chord pill</strong> to hear just that chord and highlight it on the Piano and Fretboard visualizations.
            </p>
            <p>
              <Icon icon={FaDownload} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Export any chord progression as a <strong>MIDI file</strong> using the download button. The file is named with the key, scale, and progression (e.g., "A Minor - Anthem - I V vi IV.mid") and can be dragged directly into a DAW like Ableton. Each chord gets one full bar, and the clip will follow your project tempo.
            </p>
            <p>
              <Icon icon={FaCog} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              <strong>Audio volume and instrument sounds</strong> are controlled by the Generator block's settings (the cogwheel icon on the Generator card). Changes there apply to all playback across both blocks.
            </p>
          </>
        }
      />
    </BlockWrapper>
  );
};

export default ProgressionsBlock;
