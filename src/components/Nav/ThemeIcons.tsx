import React from 'react';
import { ThemeName } from '../../theme/ThemeProvider';

interface IconProps {
  size?: number;
}

// Light theme — Sun
const SunIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// Dark theme — Crescent moon
const MoonIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// Vintage — Reel-to-reel tape (3 rectangular slots + hub)
const ReelToReelIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Outer rim */}
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.2" />
    {/* 3 rectangular slots at 120° intervals */}
    <rect x="10" y="3.5" width="4" height="5" rx="1.2" fill="currentColor" opacity="0.6" />
    <rect x="10" y="3.5" width="4" height="5" rx="1.2" fill="currentColor" opacity="0.6" transform="rotate(120 12 12)" />
    <rect x="10" y="3.5" width="4" height="5" rx="1.2" fill="currentColor" opacity="0.6" transform="rotate(240 12 12)" />
    {/* Center hub */}
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5" />
  </svg>
);

// Indie — Cassette tape reel (cogwheel/gear)
const CassetteReelIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Outer rim */}
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.2" />
    {/* Center gear hole */}
    <circle cx="12" cy="12" r="3.5" fill="currentColor" opacity="0.5" />
    {/* 6 gear teeth */}
    {[0, 60, 120, 180, 240, 300].map(angle => (
      <rect
        key={angle}
        x="11" y="4.5"
        width="2" height="3.5"
        rx="0.5"
        fill="currentColor"
        opacity="0.5"
        transform={`rotate(${angle} 12 12)`}
      />
    ))}
  </svg>
);

// Disco — Disco ball (sphere with grid lines)
const DiscoBallIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Outer sphere */}
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.2" />
    {/* Horizontal latitude lines */}
    <ellipse cx="12" cy="7" rx="9" ry="0.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    <ellipse cx="12" cy="12" rx="10.5" ry="0.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    <ellipse cx="12" cy="17" rx="9" ry="0.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    {/* Vertical longitude curves */}
    <ellipse cx="12" cy="12" rx="0.5" ry="10.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    <ellipse cx="12" cy="12" rx="5" ry="10.5" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    <ellipse cx="12" cy="12" rx="8.5" ry="10.5" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
    {/* Highlight reflection */}
    <circle cx="9" cy="8" r="1.5" fill="currentColor" opacity="0.2" />
  </svg>
);

// Hip Hop — TR-808 drum pad button
const DrumPadIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Pad body — rounded rectangle */}
    <rect x="4" y="2" width="16" height="20" rx="2.5" fill="#de7e3c" stroke="#de7e3c" strokeWidth="1" />
    {/* Divider line between top section and pad */}
    <line x1="4" y1="11" x2="20" y2="11" stroke="black" strokeWidth="0.6" opacity="0.15" />
    {/* Circular button in top section — 808 red */}
    <circle cx="12" cy="7" r="3" fill="#8b2020" />
    {/* Button highlight — inner shine */}
    <circle cx="11" cy="6" r="1.2" fill="white" opacity="0.2" />
    {/* Button shadow ring */}
    <circle cx="12" cy="7" r="3" fill="none" stroke="#7a1a1a" strokeWidth="0.5" opacity="0.4" />
  </svg>
);

const THEME_ICONS: Record<ThemeName, React.FC<IconProps>> = {
  light: SunIcon,
  dark: MoonIcon,
  vintage: ReelToReelIcon,
  indie: CassetteReelIcon,
  disco: DiscoBallIcon,
  hiphop: DrumPadIcon,
};

export const ThemeIcon: React.FC<{ theme: ThemeName; size?: number }> = ({ theme, size }) => {
  const IconComponent = THEME_ICONS[theme];
  return <IconComponent size={size} />;
};

export default ThemeIcon;
