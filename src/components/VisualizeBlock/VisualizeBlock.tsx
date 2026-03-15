import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaGuitar, FaCog, FaDownload } from 'react-icons/fa';
import { GiPianoKeys } from 'react-icons/gi';
import { MdQueueMusic } from 'react-icons/md';
import { Icon } from '../../utils/IconHelper';
import { scaleNoteCounts } from '../../utils/musicTheory';
import NotesVisualizer from '../NotesVisualizer';
import TipsModal from '../common/TipsModal';

const VisualizerSegmentedRow = styled.div`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => `4px ${theme.spacing.md}`};
  position: sticky;
  top: 0;
  z-index: 2;
`;

const SegmentedGroup = styled.div`
  display: inline-flex;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const VisualizerSegment = styled.button<{ $isActive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border: none;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : 'transparent'};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.buttonText : theme.colors.textSecondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast}, color ${({ theme }) => theme.transitions.fast};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;

  &:last-child {
    border-right: none;
  }

  &:hover {
    background: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary : `${theme.colors.primary}22`};
  }
`;

const CompactVisualizerWrapper = styled.div`
  /* Reduce the gap between toggle buttons and visualizer sections */
  & > div {
    margin-top: 4px;
    gap: 4px;
  }
`;

interface VisualizeBlockProps {
  generatorNotes: string[];
  generatorRoot: string;
  generatorScale: string;
  generatorBpm: string;
  generatorSelectedChord: number | null;
  generatorIsSeventhMode: boolean;
  showPiano: boolean;
  showGuitar: boolean;
  showProgressions: boolean;
  onStateChange: (updates: Record<string, any>) => void;
  onSelectChord: (chord: number | null) => void;
  showTips?: boolean;
  setShowTips?: (show: boolean) => void;
}

const VisualizeBlock: React.FC<VisualizeBlockProps> = ({
  generatorNotes,
  generatorRoot,
  generatorScale,
  generatorBpm,
  generatorSelectedChord,
  generatorIsSeventhMode,
  showPiano,
  showGuitar,
  showProgressions,
  onStateChange,
  onSelectChord,
  showTips: showTipsExternal,
  setShowTips: setShowTipsExternal,
}) => {
  const [playingNoteIndex, setPlayingNoteIndex] = useState<number>(-1);

  // Tips modal - use external state if provided, otherwise internal
  const [showTipsInternal, setShowTipsInternal] = useState(false);
  const showTips = showTipsExternal !== undefined ? showTipsExternal : showTipsInternal;
  const setShowTips = setShowTipsExternal || setShowTipsInternal;

  // Listen for generatorPlayingNote CustomEvent from the Generator
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ index: number }>).detail;
      setPlayingNoteIndex(detail.index);
    };
    window.addEventListener('generatorPlayingNote', handler);
    return () => window.removeEventListener('generatorPlayingNote', handler);
  }, []);

  // Chord progression persistence
  const savedProgressionIndex = parseInt(localStorage.getItem('tilesProgression') || '0', 10);
  const handleProgressionChange = useCallback((index: number) => {
    localStorage.setItem('tilesProgression', String(index));
  }, []);

  const scaleNoteCount = scaleNoteCounts[generatorScale] || 7;

  return (
    <div>
      <VisualizerSegmentedRow>
        <SegmentedGroup>
          <VisualizerSegment
            $isActive={showProgressions}
            onClick={() => onStateChange({ showProgressions: !showProgressions })}
            title="Toggle chord progressions panel"
          >
            <Icon icon={MdQueueMusic} size={16} />
            Chord Progressions
          </VisualizerSegment>
          <VisualizerSegment
            $isActive={showPiano}
            onClick={() => onStateChange({ showPiano: !showPiano })}
            title="Toggle piano visualization"
          >
            <Icon icon={GiPianoKeys} size={16} />
            Piano
          </VisualizerSegment>
          <VisualizerSegment
            $isActive={showGuitar}
            onClick={() => onStateChange({ showGuitar: !showGuitar })}
            title="Toggle guitar fretboard visualization"
          >
            <Icon icon={FaGuitar} size={14} />
            Fretboard
          </VisualizerSegment>
        </SegmentedGroup>
      </VisualizerSegmentedRow>

      <CompactVisualizerWrapper>
        <NotesVisualizer
          activeNotes={generatorNotes}
          scaleNotes={generatorNotes}
          selectedChord={generatorSelectedChord}
          root={generatorRoot}
          scale={generatorScale}
          isSeventhMode={generatorIsSeventhMode}
          visualizerType="both"
          playingNoteIndex={playingNoteIndex}
          showPiano={showPiano}
          showGuitar={showGuitar}
          showProgressions={showProgressions}
          bpm={parseInt(generatorBpm) || 120}
          scaleNoteCount={scaleNoteCount}
          initialProgressionIndex={savedProgressionIndex}
          onSelectChord={onSelectChord}
          onProgressionChange={handleProgressionChange}
        />
      </CompactVisualizerWrapper>

      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        title="About Visualize"
        content={
          <>
            <p>
              <Icon icon={GiPianoKeys} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              <Icon icon={FaGuitar} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Use the toggle buttons to show or hide the <strong>Piano</strong>, <strong>Guitar Fretboard</strong>, and <strong>Chord Progressions</strong> visualizations. Everything stays in sync with the Generator block.
            </p>
            <p>
              <Icon icon={GiPianoKeys} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Click any highlighted note on the <strong>piano</strong> to hear it played. The keyboard shows which notes belong to the current scale and highlights chord tones when a chord degree is selected.
            </p>
            <p>
              <Icon icon={FaGuitar} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Click any highlighted note on the <strong>fretboard</strong> to hear it played. The guitar fretboard uses the CAGED system — five overlapping positions (E, D, C, A, G shapes) that cover the entire neck. Use the arrow buttons to navigate between positions and see where scale notes fall across all 12 frets.
            </p>
            <p>
              <Icon icon={MdQueueMusic} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Browse 66 named <strong>chord progressions</strong> across 7 genres (Pop, Rock, Jazz, Blues, Emotional, EDM, Classical) using the dropdown. Click the dice to pick a random progression, hit play to hear all chords played in sequence, or click any chord pill to hear it individually. Piano and guitar visualizations update in real time as chords play.
            </p>
            <p>
              <Icon icon={FaDownload} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Export any chord progression as a <strong>MIDI file</strong> using the download button. The file is named with the key, scale, and progression (e.g., "A Minor - Anthem - I V vi IV.mid") and can be dragged directly into a DAW like Ableton. Each chord gets one full bar, and the clip will follow your project tempo.
            </p>
            <p>
              <Icon icon={FaCog} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              <strong>Audio volume and instrument sounds</strong> are controlled by the Generator block's settings (the cogwheel icon on the Generator card). Changes there apply to all playback across both blocks.
            </p>
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>
                <Icon icon={FaGuitar} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Tips for Practicing with the CAGED Fretboard:
              </p>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Pick one chord (like the I chord) and navigate through all five positions using the arrows. Notice how the same notes appear in different shapes — this builds your fretboard map.</li>
                <li>In each position, look at where the root notes (cyan dots marked "R") fall. These are your anchor points. Learn to spot them instantly — they tell you where you are on the neck.</li>
                <li>The five shapes always appear in the same order: E &#8594; D &#8594; C &#8594; A &#8594; G ascending the neck, then repeat. Once you memorize this sequence, you can find any chord anywhere.</li>
                <li>Practice connecting positions: play the scale in one position, then slide into the next position without stopping. The overlapping frets between positions are your "bridge" notes.</li>
                <li>Try playing the same chord progression in different positions. The voicings will sound different even though the chords are the same — this is how pros add variety to their parts.</li>
                <li>Start with the E and A shapes — these are the most common barre chord forms you already know. Then gradually add G, C, and D shapes to unlock the full neck.</li>
              </ul>
            </div>
          </>
        }
      />
    </div>
  );
};

export default VisualizeBlock;
