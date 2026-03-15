import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCog } from 'react-icons/fa';
import ToolCardDnd from '../common/ToolCardDnd';
import { Icon } from '../../utils/IconHelper';
import { GiGuitarHead } from 'react-icons/gi';

// Inline tuning fork SVG — no library has one
const TuningForkIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v7a4 4 0 0 0 8 0V3" />
    <line x1="12" y1="14" x2="12" y2="22" />
  </svg>
);

// ── Constants ────────────────────────────────────────────────

const A4 = 440;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIN_RMS = 0.01; // minimum volume threshold to trigger detection
const CLARITY_THRESHOLD = 0.90; // YIN clarity threshold

// ── Pitch Detection (YIN-inspired autocorrelation) ──────────

function detectPitch(buffer: Float32Array, sampleRate: number): { frequency: number; clarity: number } | null {
  const bufferSize = buffer.length;

  // Check if signal is loud enough
  let rms = 0;
  for (let i = 0; i < bufferSize; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / bufferSize);
  if (rms < MIN_RMS) return null;

  // YIN difference function
  const halfSize = Math.floor(bufferSize / 2);
  const yinBuffer = new Float32Array(halfSize);

  // Step 1: Difference function
  for (let tau = 0; tau < halfSize; tau++) {
    let sum = 0;
    for (let i = 0; i < halfSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  // Step 2: Cumulative mean normalized difference
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfSize; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / runningSum;
  }

  // Step 3: Absolute threshold - find first dip below threshold
  let tauEstimate = -1;
  for (let tau = 2; tau < halfSize; tau++) {
    if (yinBuffer[tau] < (1 - CLARITY_THRESHOLD)) {
      // Find the local minimum
      while (tau + 1 < halfSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) return null;

  // Step 4: Parabolic interpolation for sub-sample accuracy
  let betterTau: number;
  const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1;
  const x2 = tauEstimate + 1 < halfSize ? tauEstimate + 1 : tauEstimate;

  if (x0 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x2] ? tauEstimate : x2;
  } else if (x2 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x0] ? tauEstimate : x0;
  } else {
    const s0 = yinBuffer[x0];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[x2];
    betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }

  const frequency = sampleRate / betterTau;
  const clarity = 1 - yinBuffer[tauEstimate];

  // Sanity check: reasonable instrument frequency range (27.5 Hz to 4186 Hz)
  if (frequency < 27.5 || frequency > 4186) return null;

  return { frequency, clarity };
}

// ── Note helpers ─────────────────────────────────────────────

function frequencyToNote(freq: number): { note: string; octave: number; cents: number } {
  const semitonesFromA4 = 12 * Math.log2(freq / A4);
  const roundedSemitones = Math.round(semitonesFromA4);
  const cents = Math.round((semitonesFromA4 - roundedSemitones) * 100);

  // A4 is MIDI note 69, note index 9 in our array
  const noteIndex = ((roundedSemitones % 12) + 12 + 9) % 12;
  const octave = 4 + Math.floor((roundedSemitones + 9) / 12);

  return { note: NOTE_NAMES[noteIndex], octave, cents };
}

// ── Styled Components ────────────────────────────────────────

const TunerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const MeterContainer = styled.div`
  position: relative;
  width: 240px;
  height: 140px;
  overflow: hidden;
`;

const MeterSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

const NoteDisplay = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
`;

const NoteLetter = styled.span<{ $active: boolean }>`
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme, $active }) => $active ? theme.colors.text : theme.colors.textSecondary};
  opacity: ${({ $active }) => $active ? 1 : 0.4};
  transition: all 0.15s ease;
  line-height: 1;
`;

const NoteOctave = styled.span<{ $active: boolean }>`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: ${({ $active }) => $active ? 1 : 0.4};
  transition: all 0.15s ease;
`;

const FrequencyDisplay = styled.div<{ $active: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-variant-numeric: tabular-nums;
  transition: color 0.15s ease;
  text-align: center;
`;

const CentsDisplay = styled.div<{ $active: boolean; $inTune: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme, $active, $inTune }) =>
    !$active ? theme.colors.textSecondary :
    $inTune ? theme.colors.success :
    theme.colors.textSecondary};
  opacity: ${({ $active }) => $active ? 1 : 0.4};
  font-variant-numeric: tabular-nums;
  transition: all 0.15s ease;
  text-align: center;
  letter-spacing: 0.5px;
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`;

const TuneIconBtn = styled(motion.button)<{ $listening: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid ${({ theme, $listening }) =>
    $listening ? theme.colors.primary : theme.colors.textSecondary};
  border-radius: 50%;
  background: ${({ theme, $listening }) =>
    $listening ? `${theme.colors.primary}20` : 'transparent'};
  color: ${({ theme, $listening }) =>
    $listening ? theme.colors.primary : theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  animation: ${({ $listening }) => $listening ? pulse : 'none'} 2s ease-in-out infinite;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}15`};
  }
`;

/* Settings dropdown — matches the Flow block pattern */
const SettingsWrapper = styled.div`
  position: relative;
`;

const SettingsIconBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: ${({ theme }) => theme.spacing.xs};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  background: ${({ $active, theme }) => $active ? `${theme.colors.primary}22` : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active, theme }) => $active ? `${theme.colors.primary}33` : `${theme.colors.primary}22`};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SettingsDropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  min-width: 240px;
  overflow: visible;
  padding: ${({ theme }) => theme.spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const SettingsHeader = styled.div`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.xs}`};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  text-align: left;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: ${({ theme }) => theme.spacing.xs};
  margin-bottom: 2px;
`;

const DeviceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 200px;
  overflow-y: auto;
`;

const DeviceItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
  padding: 8px ${({ theme }) => theme.spacing.sm};
  border: 1.5px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.border + '80'};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ $active, theme }) => $active ? `${theme.colors.primary}22` : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ $active }) => $active ? 600 : 400};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}11`};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DeviceDot = styled.span<{ $active: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.fast};
`;

const DeviceLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ── Component ────────────────────────────────────────────────

interface TunerProps {
  onRemove?: () => void;
  canRemove?: boolean;
  dragHandleProps?: any;
  isRecentlyDragged?: boolean;
}

const Tuner: React.FC<TunerProps> = ({
  onRemove,
  canRemove,
  dragHandleProps,
  isRecentlyDragged,
}) => {
  const theme = useTheme() as any;

  // Audio state
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [detectedOctave, setDetectedOctave] = useState<number | null>(null);
  const [detectedCents, setDetectedCents] = useState(0);
  const [detectedFrequency, setDetectedFrequency] = useState<number | null>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Smoothing refs for stable display
  const smoothedCentsRef = useRef(0);

  // Enumerate audio input devices
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      setAudioDevices(audioInputs);
      // If no device selected yet, pick the default
      if (!selectedDeviceId && audioInputs.length > 0) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.error('[Tuner] Failed to enumerate devices:', err);
    }
  }, [selectedDeviceId]);

  // Listen for device changes (plug/unplug) — but don't request permission on mount
  useEffect(() => {
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
    };
  }, [enumerateDevices]);

  // Request mic permission + enumerate devices (called lazily, not on mount)
  const requestPermissionAndEnumerate = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      await enumerateDevices();
    } catch {
      await enumerateDevices();
    }
  }, [enumerateDevices]);

  // Close settings on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  // Start / stop listening
  const startListening = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false }
          : { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);
      // DO NOT connect to ctx.destination — no playback
      analyserRef.current = analyser;

      setIsListening(true);

      // Start the detection loop
      const buffer = new Float32Array(analyser.fftSize);
      const detect = () => {
        analyser.getFloatTimeDomainData(buffer);
        const result = detectPitch(buffer, ctx.sampleRate);

        if (result && result.clarity > CLARITY_THRESHOLD) {
          const { note, octave, cents } = frequencyToNote(result.frequency);
          // Smooth cents for display stability
          smoothedCentsRef.current = smoothedCentsRef.current * 0.6 + cents * 0.4;
          const smoothedCents = Math.round(smoothedCentsRef.current);

          setDetectedNote(note);
          setDetectedOctave(octave);
          setDetectedCents(smoothedCents);
          setDetectedFrequency(Math.round(result.frequency * 10) / 10);
        } else {
          // Signal too quiet or unclear — keep last reading but fade
          // We don't clear immediately to avoid flicker
        }

        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);
    } catch (err) {
      console.error('[Tuner] Failed to start listening:', err);
    }
  }, [selectedDeviceId]);

  const stopListening = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setDetectedNote(null);
    setDetectedOctave(null);
    setDetectedCents(0);
    setDetectedFrequency(null);
    smoothedCentsRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // When device changes while listening, restart
  const handleDeviceChange = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isListening) {
      stopListening();
      // Small delay to let the stream close properly
      setTimeout(() => {
        startListening();
      }, 100);
    }
  }, [isListening, stopListening, startListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening]);

  // ── Meter rendering ──────────────────────────────────────

  const active = detectedNote !== null;
  const inTune = active && Math.abs(detectedCents) <= 5;

  // Clamp cents for meter display range
  const clampedCents = Math.max(-50, Math.min(50, detectedCents));

  // Color of the needle based on tuning accuracy
  const getNeedleColor = () => {
    if (!active) return theme.colors.textSecondary;
    if (Math.abs(detectedCents) <= 5) return theme.colors.success || '#4BB543';
    if (Math.abs(detectedCents) <= 15) return theme.colors.warning || '#ffab00';
    return theme.colors.error || '#ff5252';
  };

  const renderMeter = () => {
    const cx = 120;
    const cy = 130;
    const radius = 100;

    // Arc from -60° to +60° (measuring from top, which is -90° in SVG coords)
    // In SVG, 0° is right. We want the arc centered at top.
    // Start angle: -150° (left side), End angle: -30° (right side)
    const startAngleDeg = -150;
    const endAngleDeg = -30;
    const tickCount = 11; // -50, -40, -30, -20, -10, 0, +10, +20, +30, +40, +50

    const ticks = [];
    for (let i = 0; i < tickCount; i++) {
      const cents = -50 + i * 10;
      const angleDeg = startAngleDeg + (i / (tickCount - 1)) * (endAngleDeg - startAngleDeg);
      const angleRad = (angleDeg * Math.PI) / 180;

      const isMajor = cents === 0;
      const isMinor = Math.abs(cents) === 50;
      const tickLength = isMajor ? 16 : isMinor ? 12 : 8;

      const x1 = cx + (radius - tickLength) * Math.cos(angleRad);
      const y1 = cy + (radius - tickLength) * Math.sin(angleRad);
      const x2 = cx + radius * Math.cos(angleRad);
      const y2 = cy + radius * Math.sin(angleRad);

      const tickColor = isMajor
        ? (theme.colors.success || '#4BB543')
        : theme.colors.textSecondary;

      ticks.push(
        <line
          key={`tick-${i}`}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={tickColor}
          strokeWidth={isMajor ? 2.5 : 1.5}
          strokeLinecap="round"
          opacity={isMajor ? 1 : 0.7}
        />
      );

      // Labels at extremes and center
      if (cents === -50 || cents === 0 || cents === 50) {
        const labelRadius = radius - tickLength - 10;
        const lx = cx + labelRadius * Math.cos(angleRad);
        const ly = cy + labelRadius * Math.sin(angleRad);
        const label = cents === 0 ? '0' : cents > 0 ? `+${cents}` : `${cents}`;
        ticks.push(
          <text
            key={`label-${i}`}
            x={lx} y={ly}
            fill={theme.colors.textSecondary}
            fontSize="10"
            fontWeight={isMajor ? '700' : '400'}
            textAnchor="middle"
            dominantBaseline="middle"
            opacity={0.7}
          >
            {label}
          </text>
        );
      }
    }

    // Needle
    const needleAngleRad = ((startAngleDeg + ((clampedCents + 50) / 100) * (endAngleDeg - startAngleDeg)) * Math.PI) / 180;
    const needleLength = radius - 20;
    const nx = cx + needleLength * Math.cos(needleAngleRad);
    const ny = cy + needleLength * Math.sin(needleAngleRad);

    return (
      <MeterSvg viewBox="0 0 240 140">
        {/* Tick marks */}
        {ticks}

        {/* Needle */}
        <line
          x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={getNeedleColor()}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ transition: 'all 0.12s ease-out' }}
        />

        {/* Center dot */}
        <circle
          cx={cx} cy={cy} r={4}
          fill={getNeedleColor()}
          style={{ transition: 'fill 0.15s ease' }}
        />

        {/* Flat / Sharp labels */}
        <text x={18} y={130} fill={theme.colors.textSecondary} fontSize="11" fontWeight="600" opacity={0.7}>&#9837;</text>
        <text x={218} y={130} fill={theme.colors.textSecondary} fontSize="11" fontWeight="600" opacity={0.7}>&#9839;</text>
      </MeterSvg>
    );
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <ToolCardDnd
      title="Tuner"
      icon={GiGuitarHead}
      onRemove={onRemove}
      canRemove={canRemove}
      dragHandleProps={dragHandleProps}
      isRecentlyDragged={isRecentlyDragged}
      additionalControls={
        <SettingsWrapper ref={settingsRef}>
          <SettingsIconBtn
            $active={showSettings}
            onClick={() => {
              if (!showSettings) requestPermissionAndEnumerate();
              setShowSettings(!showSettings);
            }}
            title="Tuner settings"
          >
            <Icon icon={FaCog} size={16} />
          </SettingsIconBtn>
          <AnimatePresence>
            {showSettings && (
              <SettingsDropdown
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <SettingsHeader>Audio Input</SettingsHeader>
                <DeviceList>
                  {audioDevices.length === 0 ? (
                    <DeviceItem $active={false} disabled style={{ opacity: 0.5, cursor: 'default' }}>
                      <DeviceLabel>No devices found</DeviceLabel>
                    </DeviceItem>
                  ) : (
                    audioDevices.map(device => (
                      <DeviceItem
                        key={device.deviceId}
                        $active={device.deviceId === selectedDeviceId}
                        onClick={() => handleDeviceChange(device.deviceId)}
                      >
                        <DeviceDot $active={device.deviceId === selectedDeviceId} />
                        <DeviceLabel>
                          {device.label || `Input ${audioDevices.indexOf(device) + 1}`}
                        </DeviceLabel>
                      </DeviceItem>
                    ))
                  )}
                </DeviceList>
              </SettingsDropdown>
            )}
          </AnimatePresence>
        </SettingsWrapper>
      }
    >
      <TunerContainer>
        {/* Tune toggle */}
        <TuneIconBtn
          $listening={isListening}
          onClick={toggleListening}
          whileTap={{ scale: 0.9 }}
          title={isListening ? 'Stop tuning' : 'Start tuning'}
        >
          <TuningForkIcon size={18} />
        </TuneIconBtn>

        {/* Meter arc */}
        <MeterContainer>
          {renderMeter()}
        </MeterContainer>

        {/* Note display */}
        <NoteDisplay>
          <NoteLetter $active={active}>
            {detectedNote || '—'}
          </NoteLetter>
          {detectedOctave !== null && (
            <NoteOctave $active={active}>
              {detectedOctave}
            </NoteOctave>
          )}
        </NoteDisplay>

        {/* Frequency */}
        {detectedFrequency !== null && (
          <FrequencyDisplay $active={active}>
            {detectedFrequency} Hz
          </FrequencyDisplay>
        )}

        {/* Cents */}
        <CentsDisplay $active={active} $inTune={inTune}>
          {active
            ? inTune
              ? 'IN TUNE'
              : `${detectedCents > 0 ? '+' : ''}${detectedCents} cents`
            : '\u00A0'}
        </CentsDisplay>
      </TunerContainer>
    </ToolCardDnd>
  );
};

export default Tuner;
