import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme, ThemeName } from '../theme/ThemeProvider';
import { saveToStorage, getFromStorage, STORAGE_KEYS } from '../utils/storageService';

type ThemeOverride = 'byTheme' | ThemeName;

interface SoundSettingsContextType {
  metronomeThemeOverride: ThemeOverride;
  setMetronomeThemeOverride: (v: ThemeOverride) => void;
  instrumentThemeOverride: ThemeOverride;
  setInstrumentThemeOverride: (v: ThemeOverride) => void;
  metronomeVolume: number;
  setMetronomeVolume: (v: number) => void;
  instrumentVolume: number;
  setInstrumentVolume: (v: number) => void;
  effectiveMetronomeTheme: ThemeName;
  effectiveInstrumentTheme: ThemeName;
}

const SoundSettingsContext = createContext<SoundSettingsContextType>({
  metronomeThemeOverride: 'byTheme',
  setMetronomeThemeOverride: () => {},
  instrumentThemeOverride: 'byTheme',
  setInstrumentThemeOverride: () => {},
  metronomeVolume: 1,
  setMetronomeVolume: () => {},
  instrumentVolume: 1,
  setInstrumentVolume: () => {},
  effectiveMetronomeTheme: 'dark',
  effectiveInstrumentTheme: 'dark',
});

export const useSoundSettings = () => useContext(SoundSettingsContext);

const VALID_OVERRIDES: ThemeOverride[] = ['byTheme', 'light', 'dark', 'vintage', 'indie', 'disco', 'hiphop'];

function isValidOverride(v: string): v is ThemeOverride {
  return VALID_OVERRIDES.includes(v as ThemeOverride);
}

export const SoundSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { themeName } = useTheme();

  const [metronomeThemeOverride, setMetronomeThemeOverrideState] = useState<ThemeOverride>(() => {
    const stored = getFromStorage(STORAGE_KEYS.SOUND_METRONOME_THEME, 'byTheme');
    return isValidOverride(stored) ? stored : 'byTheme';
  });

  const [instrumentThemeOverride, setInstrumentThemeOverrideState] = useState<ThemeOverride>(() => {
    const stored = getFromStorage(STORAGE_KEYS.SOUND_INSTRUMENT_THEME, 'byTheme');
    return isValidOverride(stored) ? stored : 'byTheme';
  });

  const [metronomeVolume, setMetronomeVolumeState] = useState<number>(() =>
    getFromStorage(STORAGE_KEYS.VOLUME_METRONOME, 1)
  );

  const [instrumentVolume, setInstrumentVolumeState] = useState<number>(() =>
    getFromStorage(STORAGE_KEYS.VOLUME_INSTRUMENT, 1)
  );

  // Persist on change
  useEffect(() => { saveToStorage(STORAGE_KEYS.SOUND_METRONOME_THEME, metronomeThemeOverride); }, [metronomeThemeOverride]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.SOUND_INSTRUMENT_THEME, instrumentThemeOverride); }, [instrumentThemeOverride]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.VOLUME_METRONOME, metronomeVolume); }, [metronomeVolume]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.VOLUME_INSTRUMENT, instrumentVolume); }, [instrumentVolume]);

  const effectiveMetronomeTheme: ThemeName =
    metronomeThemeOverride === 'byTheme' ? themeName : metronomeThemeOverride;
  const effectiveInstrumentTheme: ThemeName =
    instrumentThemeOverride === 'byTheme' ? themeName : instrumentThemeOverride;

  const setMetronomeThemeOverride = (v: ThemeOverride) => setMetronomeThemeOverrideState(v);
  const setInstrumentThemeOverride = (v: ThemeOverride) => setInstrumentThemeOverrideState(v);
  const setMetronomeVolume = (v: number) => setMetronomeVolumeState(Math.max(0, Math.min(1, v)));
  const setInstrumentVolume = (v: number) => setInstrumentVolumeState(Math.max(0, Math.min(1, v)));

  return (
    <SoundSettingsContext.Provider value={{
      metronomeThemeOverride,
      setMetronomeThemeOverride,
      instrumentThemeOverride,
      setInstrumentThemeOverride,
      metronomeVolume,
      setMetronomeVolume,
      instrumentVolume,
      setInstrumentVolume,
      effectiveMetronomeTheme,
      effectiveInstrumentTheme,
    }}>
      {children}
    </SoundSettingsContext.Provider>
  );
};
