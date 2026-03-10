import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';
import { useTheme as useAppTheme, THEME_ORDER, THEME_LABELS, ThemeName, lightTheme, darkTheme, vintageTheme, indieTheme, discoTheme, hiphopTheme } from '../../theme/ThemeProvider';
import ThemeIcon from '../Nav/ThemeIcons';

type ThemeOverride = 'byTheme' | ThemeName;

const THEME_PRIMARY: Record<ThemeName, string> = {
  light: lightTheme.colors.primary,
  dark: darkTheme.colors.primary,
  vintage: vintageTheme.colors.primary,
  indie: indieTheme.colors.primary,
  disco: discoTheme.colors.primary,
  hiphop: hiphopTheme.colors.primary,
};

interface SoundDropdownPanelProps {
  isOpen: boolean;
  themeOverride: ThemeOverride;
  setThemeOverride: (v: ThemeOverride) => void;
  volume: number;
  setVolume: (v: number) => void;
  /** CSS positioning overrides, e.g. { bottom: 'calc(100% + 8px)', left: 0 } */
  style?: React.CSSProperties;
}

const Dropdown = styled(motion.div)`
  position: absolute;
  z-index: 100;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  min-width: 160px;
  overflow: hidden;
  padding: ${({ theme }) => theme.spacing.sm};
`;

const Header = styled.div`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  text-align: left;
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: ${({ theme }) => `${theme.spacing.xs} 0`};
`;

const ByThemeButton = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 4px ${({ theme }) => theme.spacing.sm};
  background: ${({ $active, theme }) => $active ? `${theme.colors.primary}18` : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ $active }) => $active ? 700 : 500};
  transition: background-color ${({ theme }) => theme.transitions.fast}, color ${({ theme }) => theme.transitions.fast};
  text-align: left;
  border-radius: ${({ theme }) => theme.borderRadius.small};

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}11`};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ByThemeLabel = styled.span`
  flex: 1;
`;

const CheckMark = styled.span`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  margin-top: 2px;
`;

const IconButton = styled.button<{ $active: boolean; $isByThemeHint: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ $active, $isByThemeHint, theme }) =>
    $active ? `${theme.colors.primary}22` :
    $isByThemeHint ? `${theme.colors.textSecondary}10` :
    'transparent'};
  border: 1.5px solid ${({ $active, $isByThemeHint, theme }) =>
    $active ? theme.colors.primary :
    $isByThemeHint ? theme.colors.textSecondary + '40' :
    theme.colors.border + '80'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  opacity: ${({ $isByThemeHint }) => $isByThemeHint ? 0.45 : 1};
  margin: 0 auto;

  &:hover {
    transform: scale(1.1);
    opacity: 1;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const VolumeContainer = styled.div`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
`;

const VolumeLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
`;

const VolumeSlider = styled.input`
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    border: none;
  }
`;

const SoundDropdownPanel: React.FC<SoundDropdownPanelProps> = ({
  isOpen,
  themeOverride,
  setThemeOverride,
  volume,
  setVolume,
  style,
}) => {
  const { themeName } = useAppTheme();
  const isByTheme = themeOverride === 'byTheme';

  return (
    <AnimatePresence>
      {isOpen && (
        <Dropdown
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          style={style}
        >
          {/* Volume at top */}
          <VolumeContainer>
            <VolumeLabel>
              <span>Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </VolumeLabel>
            <VolumeSlider
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </VolumeContainer>

          <Divider />

          {/* Sound theme selection */}
          <Header>Sound</Header>
          <ByThemeButton
            $active={isByTheme}
            onClick={() => setThemeOverride('byTheme')}
          >
            <ByThemeLabel>By Theme</ByThemeLabel>
            {isByTheme && (
              <CheckMark><Icon icon={FaCheck} size={10} /></CheckMark>
            )}
          </ByThemeButton>

          {/* Theme icons in 3-column grid */}
          <IconGrid>
            {THEME_ORDER.map((t) => {
              const isActive = themeOverride === t;
              // When "By Theme" is selected, highlight the current theme icon but greyed out
              const isByThemeHint = isByTheme && t === themeName;
              return (
                <IconButton
                  key={t}
                  $active={isActive}
                  $isByThemeHint={isByThemeHint}
                  onClick={() => setThemeOverride(t)}
                  title={THEME_LABELS[t]}
                >
                  <span style={{
                    color: THEME_PRIMARY[t],
                    display: 'inline-flex',
                  }}>
                    <ThemeIcon theme={t} size={18} />
                  </span>
                </IconButton>
              );
            })}
          </IconGrid>
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default SoundDropdownPanel;
