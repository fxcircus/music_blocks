import React, { useState, useEffect, useCallback, useMemo, useRef, FC } from 'react';
import styled, { useTheme as useStyledTheme } from 'styled-components';
import { motion } from 'framer-motion';
import { FaPlus, FaMinus, FaChevronDown, FaLink, FaUnlink } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';
import { Card } from '../common/StyledComponents';
import TipsModal from '../common/TipsModal';

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
  showTips?: boolean;
  setShowTips?: (show: boolean) => void;
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

const BPM_MIN = 10;
const BPM_MAX = 200;

// Cryptex constants
const ITEM_H = 64;   // Row height in pixels
const TOTAL = 25;     // -12 to +12 semitones
const VISIBLE = 7;    // 3 above + center + 3 below

const VarispeedCard = styled(Card)`
  max-width: 100%;
  padding: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.xs} 0;
  }
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
  min-width: 85px; /* Prevent width change between "Link" and "Linked" */
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;

  &:hover {
    background: ${({ theme, $isLinked }) =>
      $isLinked ? theme.colors.primary + '40' : theme.colors.primary + '10'};
  }
`;

const ControlSection = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => `${theme.colors.background}44`}; /* Semi-transparent background */
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};

  @media (max-width: 768px) {
    gap: ${({ theme }) => theme.spacing.xs};
    padding: ${({ theme }) => theme.spacing.xs};
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
  font-family: inherit;
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
  font-family: inherit;
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
  font-family: inherit;
  font-weight: ${({ $isSelected }) => ($isSelected ? 700 : 400)};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s, border-color 0.12s;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}20;
  }
`;

const Divider = styled.div<{ $mobile?: boolean }>`
  width: ${({ $mobile }) => ($mobile ? '80%' : '1px')};
  height: ${({ $mobile }) => ($mobile ? '1px' : '32px')};
  background: ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    display: none;
  }
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
  isRecentlyDragged,
  showTips: showTipsExternal,
  setShowTips: setShowTipsExternal,
}) => {
  const [localBpm, setLocalBpm] = useState(propBpm);
  const [bpmInput, setBpmInput] = useState(String(propBpm));
  const [localKeyIdx, setLocalKeyIdx] = useState(propKeyIdx);
  const [localLinked, setLocalLinked] = useState(propLinked);
  const [isMobile, setIsMobile] = useState(false);
  const [showTipsInternal, setShowTipsInternal] = useState(false);
  const showTips = showTipsExternal !== undefined ? showTipsExternal : showTipsInternal;
  const setShowTips = setShowTipsExternal || setShowTipsInternal;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setBpm = useMemo(() => isLinked ? () => {} : (propSetBpm || setLocalBpm), [isLinked, propSetBpm]);
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

    for (let st = -12; st <= 12; st++) {
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

  // Cryptex state: index 12 = root (0 semitones)
  const [selectedIndex, setSelectedIndex] = useState(12);
  const drumRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startY: 0, startIdx: 0 });
  const theme = useStyledTheme();

  function clampIdx(idx: number) {
    return Math.max(0, Math.min(TOTAL - 1, idx));
  }

  // Wheel handler — debounce trackpad to one step at a time
  const wheelCooldown = useRef(false);
  useEffect(() => {
    const el = drumRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelCooldown.current) return;
      wheelCooldown.current = true;
      setSelectedIndex(prev => clampIdx(prev + (e.deltaY > 0 ? 1 : -1)));
      setTimeout(() => { wheelCooldown.current = false; }, 120);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Drag handlers — attach move/up to document so dragging works outside the component
  const handleStart = useCallback((clientY: number) => {
    dragRef.current = { active: true, startY: clientY, startIdx: selectedIndex };
  }, [selectedIndex]);

  const handleMove = useCallback((clientY: number) => {
    if (!dragRef.current.active) return;
    const dy = clientY - dragRef.current.startY;
    const steps = Math.round(dy / (ITEM_H * 0.6));
    setSelectedIndex(clampIdx(dragRef.current.startIdx - steps));
  }, []);

  const handleEnd = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  // Global mouse listeners for drag-outside-component support
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onMouseUp = () => handleEnd();
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleMove, handleEnd]);

  const shift = useCallback((direction: number) => {
    setSelectedIndex(prev => clampIdx(prev + direction));
  }, []);

  // Sliding offset: shift the inner container so selectedIndex is centered
  const slideY = -(selectedIndex * ITEM_H) + (ITEM_H * 3);

  // HSL → hex helper for gradient computation
  function hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  // Color gradient for cryptex rows:
  //   −12 (red) ← amber ← [ROOT purple] → teal → +12 (green)
  //   Root is vivid purple — orthogonal to the red↔green axis, pops on scroll
  //   Saturation builds outward from muted (±1) to vivid (±12)
  function getColor(st: number): string {
    if (st === 0) return theme.colors.primary; // vivid purple, completely off-gradient

    const abs = Math.abs(st);
    const t = abs / 12; // 0→1 progress from root to octave

    if (st < 0) {
      // Warm: near-white → Amber → Red
      const h = 40 - t * 40;
      const s = 12 + t * 88;   // 12% → 100%  (nearly gray at ±1)
      const l = 55 + t * 11;   // 55% → 66%
      return hslToHex(h, s, l);
    } else {
      // Cool: near-white → Teal → Green
      const h = 185 - t * 45;
      const s = 12 + t * 73;   // 12% → 85%   (nearly gray at ±1)
      const l = 55 - t * 20;   // 55% → 35%
      return hslToHex(h, s, l);
    }
  }

  function getTag(st: number): string {
    if (st === 0) return "ROOT";
    if (st === -12) return "\u22121 OCT";
    if (st === 12) return "+1 OCT";
    return (st > 0 ? "+" : "") + st + " st";
  }

  return (
    <VarispeedCard
      className="varispeed-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ControlSection>
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

        <Divider $mobile={isMobile} />

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
      </ControlSection>

      {/* Cryptex drum-roller */}
      <div
        ref={drumRef}
        onMouseDown={e => handleStart(e.clientY)}
        onTouchStart={e => handleStart(e.touches[0].clientY)}
        onTouchMove={e => handleMove(e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        style={{
          position: "relative",
          height: ITEM_H * VISIBLE,
          overflow: "hidden",
          cursor: "ns-resize",
          userSelect: "none",
          touchAction: "none",
          borderRadius: theme.borderRadius.medium,
        }}
      >
        {/* Top tap zone (step up / lower index) */}
        <div
          onClick={() => shift(-1)}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: ITEM_H * 3, zIndex: 8 }}
        />
        {/* Bottom tap zone (step down / higher index) */}
        <div
          onClick={() => shift(1)}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: ITEM_H * 3, zIndex: 8 }}
        />

        {/* Center highlight band — tints to match selected row's gradient color */}
        {(() => {
          const bandColor = getColor(calculations[selectedIndex].semitones);
          return (
            <div style={{
              position: "absolute",
              top: ITEM_H * 3, left: 0, right: 0, height: ITEM_H,
              background: `${bandColor}14`,
              borderTop: `1px solid ${bandColor}4D`,
              borderBottom: `1px solid ${bandColor}4D`,
              zIndex: 5, pointerEvents: "none",
              transition: "background 0.25s ease, border-color 0.25s ease",
            }} />
          );
        })()}

        {/* Sliding inner container — all 25 rows, translated smoothly */}
        <div style={{
          transform: `translateY(${slideY}px)`,
          transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: "none",
        }}>
          {calculations.map((calc, idx) => {
            const dist = Math.abs(idx - selectedIndex);
            const atCenter = dist === 0;
            const isLandmark = calc.semitones === 0 || Math.abs(calc.semitones) === 12;
            const color = getColor(calc.semitones);
            // Landmarks always show their color; others only when selected
            const showColor = isLandmark || atCenter;
            const displayColor = showColor ? color : theme.colors.text;

            // Smooth opacity/scale falloff
            const opacity = dist === 0 ? 1 : dist === 1 ? 0.6 : dist === 2 ? 0.5 : dist === 3 ? 0.4 : 0;
            const scale = dist === 0 ? 1 : dist === 1 ? 0.92 : dist === 2 ? 0.84 : dist === 3 ? 0.78 : 0.75;
            const fontSize = atCenter ? 30 : 20;
            const bpmFontSize = atCenter ? 24 : 16;
            const bpmLabelSize = atCenter ? 11 : 9;

            // Divider width matches scale so lines taper toward edges
            // Hide dividers on the selected row and the row just above it
            const hideDivider = dist === 0 || idx === selectedIndex - 1;
            const dividerOpacity = hideDivider ? 0 : dist === 1 ? 0.4 : dist === 2 ? 0.3 : 0.2;

            return (
              <div
                key={calc.semitones}
                style={{
                  height: ITEM_H,
                  display: "flex",
                  alignItems: "center",
                  padding: isMobile ? "0 8px" : "0 16px",
                  opacity,
                  transform: `scale(${scale})`,
                  transition: "opacity 0.25s ease, transform 0.25s ease, color 0.25s ease, background 0.25s ease",
                  color: displayColor,
                  fontWeight: (atCenter || isLandmark) ? 700 : 400,
                  position: "relative",
                  background: isLandmark ? `${color}20` : (atCenter ? `${color}18` : undefined),
                  borderRadius: (atCenter || isLandmark) ? theme.borderRadius.small : undefined,
                }}
              >
                {/* Faint divider line — width follows scale for 3D taper */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: "5%",
                  right: "5%",
                  height: 1,
                  background: theme.colors.border,
                  opacity: dividerOpacity / opacity,
                  transition: "opacity 0.25s ease",
                }} />
                {/* Semitone tag */}
                <div style={{
                  flex: isMobile ? "0 0 45px" : "0 0 60px",
                  fontSize: 10,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: displayColor,
                }}>
                  {getTag(calc.semitones)}
                </div>

                {/* Note name */}
                <div style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize,
                  transition: "font-size 0.25s ease",
                  fontFamily: "inherit",
                  color: displayColor,
                  textShadow: isLandmark
                    ? `0 0 24px ${color}88, 0 0 48px ${color}44`
                    : atCenter ? `0 0 16px ${color}55` : undefined,
                }}>
                  {calc.name}
                </div>

                {/* Target BPM */}
                <div style={{ flex: isMobile ? "0 0 90px" : "0 0 130px", textAlign: "right" }}>
                  <span style={{
                    fontSize: bpmFontSize,
                    transition: "font-size 0.25s ease",
                    fontFamily: "inherit",
                  }}>
                    {calc.targetBpm.toFixed(2)}
                  </span>
                  <span style={{ fontSize: bpmLabelSize, opacity: 0.5 }}>
                    {" "}BPM
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top gradient fade */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: ITEM_H * 1.2,
          background: `linear-gradient(to bottom, ${theme.colors.card} 20%, transparent)`,
          zIndex: 10, pointerEvents: "none",
        }} />

        {/* Bottom gradient fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: ITEM_H * 1.2,
          background: `linear-gradient(to top, ${theme.colors.card} 20%, transparent)`,
          zIndex: 10, pointerEvents: "none",
        }} />
      </div>

      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        title="How to Use the Varispeed Calculator"
        content={
          <>
            <p>
              Varispeed recording is a classic studio technique pioneered by 1960s artists like The Beatles. By changing the tape machine's playback speed during recording, you can achieve unique tonal qualities that are impossible to recreate with digital pitch shifting alone.
            </p>

            <p>This calculator helps you quickly find the target BPM for each semitone shift up to an octave higher or lower. Each semitone shift corresponds to a ~5.95% change in BPM — for example, a track in C at 100 BPM pitched up one semitone to C# would play back at ~105.95 BPM.</p>

            <h3>Famous Example: "Strawberry Fields Forever"</h3>
            <p>
              The Beatles' <strong>"Strawberry Fields Forever"</strong> (1967) is perhaps the most famous use of varispeed. Producer George Martin and engineer Geoff Emerick combined two different takes recorded in different keys and tempos:
            </p>
            <ul>
              <li>— Take 7 was recorded in A major at a slower tempo (~90 BPM)</li>
              <li>— Take 26 was recorded in C major at a faster tempo (~108 BPM)</li>
              <li>— By speeding up Take 7 and slowing down Take 26 (by about 11.5%), Martin and Emerick matched both the pitch and tempo, splicing them together at exactly the one-minute mark</li>
              <li>— <u><b>*Note:</b></u> the tempos are approximate, the Beatles didn't use a click track, which was typical for the era. The result lands in a key somewhere between A and B♭ at roughly 103 BPM, with that slightly "off-pitch," ethereal quality that makes the track so dreamlike. The formant shifts from varispeed give John Lennon's voice its unique, swimming character on the recording.</li>
            </ul>
            <h3>Using Re-Pitch in Ableton Live</h3>
            <p>
              Ableton Live has a built-in warp mode called <strong>Re-Pitch</strong> that behaves exactly like varispeed on a tape machine — changing the BPM changes the pitch of the sample.
            </p>
            <img
              src={process.env.PUBLIC_URL + '/ableton_re_pitch_warp_mode.png'}
              alt="Ableton Live Re-Pitch warp mode"
              style={{ width: '50%', borderRadius: '8px', margin: '12px 0' }}
            />
            <p>
              To use it with this calculator:
            </p>
            <ul>
              <li>1. Decide what pitch shift you want and find the target BPM in the calculator</li>
              <li>2. Set your Ableton project to that target BPM and record your part</li>
              <li>3. Set the recorded clip's warp mode to <strong>Re-Pitch</strong></li>
              <li>4. Change the project BPM back to your original BPM — the sample will shift in pitch automatically</li>
            </ul>
            <p>
              <em>This gives you the classic varispeed tape effect entirely within Ableton, with precise control over the resulting pitch.</em>
            </p>
          </>
        }
      />
    </VarispeedCard>
  );
};

export default Varispeed;