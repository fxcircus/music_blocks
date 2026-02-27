import React, { useState, useEffect, useCallback, useMemo, useRef, FC } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaWaveSquare, FaPlus, FaMinus, FaChevronDown, FaLink, FaUnlink } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';
import { Card, CardTitle, CardIconWrapper } from '../common/StyledComponents';
import TipsModal from '../common/TipsModal';
import HelpButton from '../common/HelpButton';
import DragHandle from '../common/DragHandle';

interface VarispeedProps {
  bpm?: number;
  setBpm?: (bpm: number) => void;
  keyIdx?: number;
  setKeyIdx?: (keyIdx: number) => void;
  linkedToGenerator?: boolean;
  setLinkedToGenerator?: (linked: boolean) => void;
  generatorBpm?: string;
  generatorRoot?: string;
  dragHandleProps?: any;
  isRecentlyDragged?: boolean;
}

// Notes for chromatic scale display (using Unicode ♯ and ♭)
const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const FLAT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

// Map note names to chromatic index for proper linking
const NOTE_TO_INDEX: Record<string, number> = {
  'C': 0, 'B♯': 0,
  'C♯': 1, 'C#': 1, 'D♭': 1, 'Db': 1,
  'D': 2,
  'D♯': 3, 'D#': 3, 'E♭': 3, 'Eb': 3,
  'E': 4, 'F♭': 4, 'Fb': 4,
  'F': 5, 'E♯': 5, 'E#': 5,
  'F♯': 6, 'F#': 6, 'G♭': 6, 'Gb': 6,
  'G': 7,
  'G♯': 8, 'G#': 8, 'A♭': 8, 'Ab': 8,
  'A': 9,
  'A♯': 10, 'A#': 10, 'B♭': 10, 'Bb': 10,
  'B': 11, 'C♭': 11, 'Cb': 11
};

const NOTE_COLORS: { [key: number]: string } = {
  0: "#e8a849", 1: "#d4834e", 2: "#c96b5a", 3: "#b85565",
  4: "#a74270", 5: "#963e7a", 6: "#7e4a8a", 7: "#65569a",
  8: "#4c62aa", 9: "#3a78b0", 10: "#4a8ea0", 11: "#5aa490"
};

const BPM_MIN = 10;
const BPM_MAX = 200;

const VarispeedCard = styled(Card)`
  max-width: 100%;
  padding: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

const VarispeedHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;
`;

const HeaderControls = styled.div`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
`;

const LinkToggle = styled(motion.button)<{ $isLinked: boolean }>`
  background: ${({ theme, $isLinked }) =>
    $isLinked ? theme.colors.primary + '30' : theme.colors.card};
  border: 1px solid ${({ theme, $isLinked }) =>
    $isLinked ? theme.colors.primary : theme.colors.border};
  color: ${({ theme, $isLinked }) =>
    $isLinked ? theme.colors.primary : theme.colors.textSecondary};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s;

  &:hover {
    background: ${({ theme, $isLinked }) =>
      $isLinked ? theme.colors.primary + '40' : theme.colors.primary + '10'};
  }
`;

const ControlSection = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => `${theme.colors.background}44`}; /* Semi-transparent background */
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ControlLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const BpmInput = styled.input`
  width: 72px;
  height: 36px;
  background: ${({ theme }) => theme.colors.inputBackground};
  border: 1px solid ${({ theme }) => theme.colors.primary}40;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  text-align: center;
  font-family: 'Courier New', monospace;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  /* Remove number input arrows */
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const ControlButton = styled(motion.button)<{ disabled?: boolean }>`
  width: 32px;
  height: 32px;
  background: ${({ theme, disabled }) =>
    disabled ? theme.colors.card : `${theme.colors.primary}20`};
  border: 1px solid ${({ theme, disabled }) =>
    disabled ? theme.colors.border : `${theme.colors.primary}60`};
  color: ${({ theme, disabled }) =>
    disabled ? theme.colors.textSecondary : theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};

  &:hover {
    background: ${({ theme, disabled }) =>
      disabled ? theme.colors.card : `${theme.colors.primary}30`};
  }
`;

const KeyPickerButton = styled.button`
  height: 36px;
  min-width: 56px;
  padding: 0 14px;
  background: ${({ theme }) => theme.colors.inputBackground};
  border: 1px solid ${({ theme }) => theme.colors.primary}40;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-family: 'Courier New', monospace;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const KeyPickerDropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  z-index: 100;
  box-shadow: none;
  min-width: 180px;
`;

const KeyOption = styled.button<{ $isSelected: boolean }>`
  height: 36px;
  background: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary + '30' : `${theme.colors.background}44`};
  border: 1px solid ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.border};
  color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: 'Courier New', monospace;
  font-weight: ${({ $isSelected }) => ($isSelected ? 700 : 400)};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}20;
  }
`;

const Divider = styled.div<{ $mobile?: boolean }>`
  width: ${({ $mobile }) => ($mobile ? '80%' : '1px')};
  height: ${({ $mobile }) => ($mobile ? '1px' : '32px')};
  background: ${({ theme }) => theme.colors.border};
`;

const CalculationRow = styled.div<{ $isSource?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ theme, $isSource }) =>
    $isSource ? theme.spacing.sm : `${theme.spacing.xs} 0`};
  background: ${({ theme, $isSource }) =>
    $isSource ? theme.colors.primary + '10' : 'transparent'};
  border-top: ${({ theme, $isSource }) =>
    $isSource ? `1px solid ${theme.colors.primary}30` : 'none'};
  border-bottom: ${({ theme, $isSource }) =>
    $isSource ? `1px solid ${theme.colors.primary}30` : 'none'};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: all 0.15s;

  &:hover {
    background: ${({ theme, $isSource }) =>
      $isSource ? theme.colors.primary + '15' : theme.colors.primary + '05'};
  }
`;

const NoteName = styled.div<{ $isSource?: boolean; $color?: string }>`
  width: 50px;
  font-size: ${({ theme, $isSource }) =>
    $isSource ? theme.fontSizes.lg : theme.fontSizes.sm};
  font-weight: ${({ $isSource }) => ($isSource ? 700 : 400)};
  color: ${({ theme, $isSource, $color }) =>
    $isSource ? theme.colors.primary : $color || theme.colors.text};
  text-shadow: ${({ $isSource }) =>
    $isSource ? '0 0 15px rgba(232,168,73,0.4)' : 'none'};

  @media (max-width: 768px) {
    width: 32px;
    text-align: center;
  }
`;

const BpmBar = styled.div<{ $isSource?: boolean }>`
  flex: 1;
  height: ${({ $isSource }) => ($isSource ? '34px' : '22px')};
  position: relative;
  background: ${({ theme }) => `${theme.colors.background}44`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  overflow: hidden;
  border: 1px solid ${({ theme, $isSource }) =>
    $isSource ? theme.colors.primary + '60' : theme.colors.border};

  @media (max-width: 768px) {
    height: ${({ $isSource }) => ($isSource ? '34px' : '24px')};
  }
`;

const BpmBarFill = styled.div<{ $width: number; $isSource?: boolean; $color?: string }>`
  width: ${({ $width }) => `${$width}%`};
  height: 100%;
  background: ${({ theme, $isSource, $color }) =>
    $isSource
      ? `linear-gradient(90deg, ${theme.colors.primary}60, ${theme.colors.primary}30)`
      : `linear-gradient(90deg, ${$color}44, ${$color}15)`};
  border-right: ${({ theme, $isSource, $color }) =>
    `2px solid ${$isSource ? theme.colors.primary : $color}88`};
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
`;

const BpmValue = styled.div<{ $isSource?: boolean }>`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: ${({ theme, $isSource }) =>
    $isSource ? theme.fontSizes.sm : theme.fontSizes.xs};
  color: ${({ theme, $isSource }) =>
    $isSource ? theme.colors.primary : theme.colors.textSecondary};
  font-weight: ${({ $isSource }) => ($isSource ? 700 : 400)};
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
`;


function KeyPicker({ keyIdx, setKeyIdx, disabled, displayKey }: { keyIdx: number; setKeyIdx: (idx: number) => void; disabled?: boolean; displayKey?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <KeyPickerButton
        onClick={() => !disabled && setOpen(!open)}
        style={{
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {displayKey || NOTES[keyIdx]}
        <Icon icon={FaChevronDown} size={10} />
      </KeyPickerButton>

      {open && (
        <KeyPickerDropdown>
          {NOTES.map((note, i) => (
            <KeyOption
              key={note}
              $isSelected={keyIdx === i}
              onClick={() => {
                setKeyIdx(i);
                setOpen(false);
              }}
            >
              {note}
            </KeyOption>
          ))}
        </KeyPickerDropdown>
      )}
    </div>
  );
}

const Varispeed: FC<VarispeedProps> = ({
  bpm: propBpm = 120,
  setBpm: propSetBpm,
  keyIdx: propKeyIdx = 0,
  setKeyIdx: propSetKeyIdx,
  linkedToGenerator: propLinked = false,
  setLinkedToGenerator: propSetLinked,
  generatorBpm,
  generatorRoot,
  dragHandleProps,
  isRecentlyDragged
}) => {
  const [localBpm, setLocalBpm] = useState(propBpm);
  const [bpmInput, setBpmInput] = useState(String(propBpm));
  const [localKeyIdx, setLocalKeyIdx] = useState(propKeyIdx);
  const [localLinked, setLocalLinked] = useState(propLinked);
  const [isMobile, setIsMobile] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const isLinked = propSetLinked ? propLinked : localLinked;
  const setIsLinked = propSetLinked || setLocalLinked;

  // Convert generator root note to key index
  const getKeyIndexFromRoot = useCallback((root: string) => {
    // Use the NOTE_TO_INDEX mapping for proper enharmonic handling
    const index = NOTE_TO_INDEX[root];
    return index !== undefined ? index : 0;
  }, []);

  // Use generator values when linked, otherwise use local/prop values
  const effectiveBpm = isLinked && generatorBpm ? parseInt(generatorBpm, 10) : (propSetBpm ? propBpm : localBpm);
  const effectiveKeyIdx = isLinked && generatorRoot ? getKeyIndexFromRoot(generatorRoot) : (propSetKeyIdx ? propKeyIdx : localKeyIdx);

  const bpm = effectiveBpm;
  const keyIdx = effectiveKeyIdx;
  const setBpm = isLinked ? () => {} : (propSetBpm || setLocalBpm);
  const setKeyIdx = isLinked ? () => {} : (propSetKeyIdx || setLocalKeyIdx);

  // When linked, use the actual generator root for display (preserves enharmonic spelling)
  const displayKey = isLinked && generatorRoot ? generatorRoot : NOTES[keyIdx];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Sync bpmInput when linked and generator values change
  useEffect(() => {
    if (isLinked && generatorBpm) {
      setBpmInput(generatorBpm);
    }
  }, [isLinked, generatorBpm]);

  const handleBpmChange = useCallback((val: number) => {
    const clamped = Math.max(BPM_MIN, Math.min(BPM_MAX, val));
    setBpm(clamped);
    setBpmInput(String(clamped));
  }, [setBpm]);

  const handleBpmInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setBpmInput(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= BPM_MIN && parsed <= BPM_MAX) {
      setBpm(parsed);
    }
  }, [setBpm]);

  const handleBpmBlur = useCallback(() => {
    const parsed = parseFloat(bpmInput);
    if (isNaN(parsed) || parsed < BPM_MIN) {
      setBpm(BPM_MIN);
      setBpmInput(String(BPM_MIN));
    } else if (parsed > BPM_MAX) {
      setBpm(BPM_MAX);
      setBpmInput(String(BPM_MAX));
    } else {
      setBpmInput(String(parsed));
    }
  }, [bpmInput, setBpm]);

  const calculations = useMemo(() => {
    const result = [];

    // When linked and we have a flat root, use flats for the display
    const useFlats = isLinked && generatorRoot && generatorRoot.includes('♭');

    for (let st = -6; st <= 5; st++) {
      const noteIdx = ((keyIdx + st) % 12 + 12) % 12;
      // If linked with a flat root, use flats throughout
      // Otherwise use flats for downward transpositions, sharps for upward
      const name = useFlats ? FLAT_NAMES[noteIdx] : (st < 0 ? FLAT_NAMES[noteIdx] : SHARP_NAMES[noteIdx]);
      const targetBpm = bpm * Math.pow(2, st / 12);
      const ratio = targetBpm / bpm;
      result.push({ name, noteIdx, semitones: st, targetBpm, ratio });
    }
    return result;
  }, [bpm, keyIdx, isLinked, generatorRoot]);

  const maxBpm = Math.max(...calculations.map(c => c.targetBpm));

  const formatBpm = (bpm: number) => bpm.toFixed(2);

  return (
    <VarispeedCard
      className="varispeed-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <VarispeedHeader>
        <DragHandle dragHandleProps={dragHandleProps} />
        <CardIconWrapper>
          <Icon icon={FaWaveSquare} size={20} />
        </CardIconWrapper>
        <CardTitle>Varispeed Calculator</CardTitle>
        <HeaderControls>
          <HelpButton onClick={() => setShowTips(true)} />
        </HeaderControls>
      </VarispeedHeader>

      <ControlSection>
        <ControlGroup>
          <ControlLabel>BPM</ControlLabel>
          <ControlButton
            disabled={isLinked}
            onClick={() => !isLinked && handleBpmChange(bpm - 1)}
            whileHover={!isLinked ? { scale: 1.1 } : {}}
            whileTap={!isLinked ? { scale: 0.95 } : {}}
          >
            <Icon icon={FaMinus} size={12} />
          </ControlButton>
          <BpmInput
            type="number"
            inputMode="decimal"
            min={BPM_MIN}
            max={BPM_MAX}
            value={bpmInput}
            onChange={handleBpmInput}
            onBlur={handleBpmBlur}
            disabled={isLinked}
            style={{ opacity: isLinked ? 0.5 : 1 }}
          />
          <ControlButton
            disabled={isLinked}
            onClick={() => !isLinked && handleBpmChange(bpm + 1)}
            whileHover={!isLinked ? { scale: 1.1 } : {}}
            whileTap={!isLinked ? { scale: 0.95 } : {}}
          >
            <Icon icon={FaPlus} size={12} />
          </ControlButton>
        </ControlGroup>

        <Divider $mobile={isMobile} />

        <ControlGroup>
          <ControlLabel>Key</ControlLabel>
          <KeyPicker keyIdx={keyIdx} setKeyIdx={setKeyIdx} disabled={isLinked} displayKey={displayKey} />
        </ControlGroup>

        <Divider $mobile={isMobile} />

        <LinkToggle
          $isLinked={isLinked}
          onClick={() => setIsLinked(!isLinked)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isLinked ? "Unlink from Inspiration Generator" : "Link to Inspiration Generator"}
        >
          <Icon icon={isLinked ? FaLink : FaUnlink} size={14} />
          {isLinked ? "Linked" : "Link"}
        </LinkToggle>
      </ControlSection>

      <div>
        {calculations.map((calc) => {
          const isSource = calc.semitones === 0;
          const barRatio = calc.targetBpm / maxBpm;
          const color = NOTE_COLORS[calc.noteIdx];

          return (
            <CalculationRow key={calc.semitones} $isSource={isSource}>
              <NoteName $isSource={isSource} $color={color}>
                {calc.name}
              </NoteName>

              <BpmBar $isSource={isSource}>
                <BpmBarFill
                  $width={barRatio * 100}
                  $isSource={isSource}
                  $color={color}
                />
                <BpmValue $isSource={isSource}>
                  {formatBpm(calc.targetBpm)} BPM
                </BpmValue>
              </BpmBar>

              {!isMobile && (
                <div style={{
                  width: 60,
                  textAlign: 'right',
                  fontSize: '11px',
                  color: isSource ? '#e8a849' : calc.ratio > 1 ? '#a0c070' : '#c07070',
                  marginLeft: '8px'
                }}>
                  {isSource ? '1.000×' : `${calc.ratio.toFixed(3)}×`}
                </div>
              )}
            </CalculationRow>
          );
        })}
      </div>

      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        title="How to Use the Varispeed Calculator"
        content={
          <>
            <h3>The Magic of Varispeed Recording</h3>
            <p>
              Varispeed recording is a classic studio technique pioneered by 1960s artists like The Beatles. By changing the tape machine's playback speed during recording, you can achieve unique tonal qualities that are impossible to recreate with digital pitch shifting alone.
            </p>

            <h3>Famous Example: "Strawberry Fields Forever"</h3>
            <p>
              The Beatles' <strong>"Strawberry Fields Forever"</strong> (1967) is perhaps the most famous use of varispeed. Producer George Martin combined two different takes recorded in different keys and tempos:
            </p>
            <ul>
              <li>Take 7 was recorded in C major at a slower tempo</li>
              <li>Take 26 was recorded in A major at a faster tempo</li>
              <li>By speeding up Take 7 and slowing down Take 26, Martin matched both the pitch and tempo, creating the song's distinctive, dreamlike quality</li>
            </ul>
            <p>
              The result? That slightly "wobbly," ethereal sound that makes the track so memorable. The formant shifts from varispeed give John Lennon's voice its unique character on the recording.
            </p>

            <h3>Using This Calculator</h3>
            <p>
              <strong>To pitch down:</strong> Set your DAW to the target BPM (faster), record your part, then slow playback to your original BPM.
            </p>
            <p>
              <strong>To pitch up:</strong> Set your DAW to the target BPM (slower), record your part, then speed playback to your original BPM.
            </p>
            <p>
              <em>Each semitone equals approximately 5.95% speed change — the same ratio used on analog tape machines.</em>
            </p>
          </>
        }
      />
    </VarispeedCard>
  );
};

export default Varispeed;