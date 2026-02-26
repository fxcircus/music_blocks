import React, { useState, useEffect, FC } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { FaMusic } from 'react-icons/fa';
import { Card, CardTitle, CardIconWrapper } from '../common/StyledComponents';
import { Icon } from '../../utils/IconHelper';

interface Scene {
  name: string;
  bars: number;
  energy: number;
}

interface Template {
  desc: string;
  vibe: string;
  scenes: Scene[];
  category?: string;
}

interface Category {
  label: string;
  templates: Record<string, Omit<Template, 'category'>>;
}

interface ArrangementToolProps {
  // Add any props if needed for state synchronization
}

const CATEGORIES: Category[] = [
  {
    label: "GENERAL",
    templates: {
      "Slow Burn": {
        desc: "Energy only goes up. Patient, layered build.",
        vibe: "Ambient, downtempo, Bonobo, chillwave",
        scenes: [
          { name: "Intro", bars: 8, energy: 1 },
          { name: "Foundation", bars: 8, energy: 1 },
          { name: "Add Layer", bars: 8, energy: 2 },
          { name: "Add Layer 2", bars: 8, energy: 2 },
          { name: "Full", bars: 16, energy: 3 },
          { name: "Brighten", bars: 8, energy: 3 },
          { name: "Peak", bars: 8, energy: 4 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
      "Two Peaks": {
        desc: "Classic dance arc. Build, release, build again harder.",
        vibe: "House, techno, EDM, dancefloor",
        scenes: [
          { name: "Intro", bars: 16, energy: 1 },
          { name: "Build", bars: 8, energy: 2 },
          { name: "Drop 1", bars: 16, energy: 4 },
          { name: "Breakdown", bars: 16, energy: 1 },
          { name: "Build 2", bars: 8, energy: 2 },
          { name: "Drop 2", bars: 16, energy: 4 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
      "Storyteller": {
        desc: "Verse does the work, chorus is the reward.",
        vibe: "Pop, R&B, singer-songwriter, vocal tracks",
        scenes: [
          { name: "Intro", bars: 4, energy: 1 },
          { name: "Verse 1", bars: 16, energy: 2 },
          { name: "Chorus", bars: 8, energy: 4 },
          { name: "Verse 2", bars: 16, energy: 2 },
          { name: "Chorus 2", bars: 8, energy: 4 },
          { name: "Bridge", bars: 8, energy: 3 },
          { name: "Final Chorus", bars: 16, energy: 4 },
          { name: "Outro", bars: 4, energy: 1 },
        ],
      },
      "Hook First": {
        desc: "Leads with the strongest idea. No patience.",
        vibe: "Trap, pop punk, short & punchy, TikTok-era",
        scenes: [
          { name: "Hook", bars: 8, energy: 4 },
          { name: "Verse 1", bars: 8, energy: 2 },
          { name: "Hook 2", bars: 8, energy: 4 },
          { name: "Verse 2", bars: 8, energy: 2 },
          { name: "Bridge", bars: 4, energy: 3 },
          { name: "Hook 3", bars: 8, energy: 4 },
          { name: "Outro", bars: 4, energy: 1 },
        ],
      },
      "Loop Rider": {
        desc: "Beat barely changes. Hypnotic. Arrangement is what sits on top.",
        vibe: "Hip hop, boom bap, lo-fi, beat tapes",
        scenes: [
          { name: "Intro", bars: 4, energy: 1 },
          { name: "Hook", bars: 8, energy: 3 },
          { name: "Verse 1", bars: 16, energy: 2 },
          { name: "Hook 2", bars: 8, energy: 3 },
          { name: "Verse 2", bars: 16, energy: 2 },
          { name: "Hook 3", bars: 8, energy: 3 },
          { name: "Outro", bars: 4, energy: 1 },
        ],
      },
    },
  },
  {
    label: "BEATLES",
    templates: {
      "AABA Middle Eight": {
        desc: "Pre-Beatles pop form they perfected. No chorus — the verse IS the hook.",
        vibe: "She Loves You, I Want to Hold Your Hand, Yesterday",
        scenes: [
          { name: "Verse 1 + Refrain", bars: 8, energy: 2 },
          { name: "Verse 2 + Refrain", bars: 8, energy: 2 },
          { name: "Bridge (Middle 8)", bars: 8, energy: 3 },
          { name: "Verse 3 + Refrain", bars: 8, energy: 2 },
          { name: "Bridge 2", bars: 8, energy: 3 },
          { name: "Verse 4 + Refrain", bars: 8, energy: 2 },
          { name: "Tag Ending", bars: 4, energy: 2 },
        ],
      },
      "Compact & Dense": {
        desc: "Chorus in the first 20 seconds. Everything in under 3 minutes.",
        vibe: "A Hard Day's Night, Can't Buy Me Love, Twist and Shout",
        scenes: [
          { name: "Chorus", bars: 4, energy: 4 },
          { name: "Verse 1", bars: 8, energy: 2 },
          { name: "Chorus", bars: 4, energy: 4 },
          { name: "Verse 2", bars: 8, energy: 2 },
          { name: "Solo / Break", bars: 8, energy: 3 },
          { name: "Verse 3", bars: 8, energy: 2 },
          { name: "Chorus + Tag", bars: 8, energy: 4 },
        ],
      },
    },
  },
  {
    label: "PINK FLOYD",
    templates: {
      "The Slow Boil": {
        desc: "Starts quiet. Tension accumulates until the release is almost physical.",
        vibe: "Time, Comfortably Numb, Money, The Great Gig in the Sky",
        scenes: [
          { name: "Sound Effects / Intro", bars: 8, energy: 1 },
          { name: "Verse 1 — Sparse", bars: 16, energy: 2 },
          { name: "Verse 2 — Fills Added", bars: 16, energy: 2 },
          { name: "Pre-Solo Build", bars: 8, energy: 3 },
          { name: "Solo — Release", bars: 16, energy: 4 },
          { name: "Verse 3 — Full Band", bars: 16, energy: 3 },
          { name: "Final Solo — Soaring", bars: 16, energy: 4 },
          { name: "Outro / Fade", bars: 8, energy: 1 },
        ],
      },
    },
  },
];

const ENERGY_COLORS: Record<number, { bg: string; fill: string; clip: string }> = {
  1: { bg: "#1E3A52", fill: "#2B5B84", clip: "#3A7BBF" },
  2: { bg: "#3D3818", fill: "#8B7E2A", clip: "#C4B236" },
  3: { bg: "#3D2510", fill: "#9B5E28", clip: "#E08A3A" },
  4: { bg: "#3D1515", fill: "#8B2E2E", clip: "#D14545" },
};

const CATEGORY_COLORS: Record<string, string> = {
  GENERAL: "#888",
  BEATLES: "#7B68EE",
  "PINK FLOYD": "#FF6B9D",
  "NEIL YOUNG": "#C8A84E",
  "KING CRIMSON": "#E04040",
  "BRIAN ENO": "#40B0A0",
};

// Animations (must be defined before usage)
const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fillIn = keyframes`
  from {
    width: 0%;
  }
`;

const growUp = keyframes`
  from {
    transform: scaleY(0);
    transform-origin: bottom;
  }
  to {
    transform: scaleY(1);
    transform-origin: bottom;
  }
`;

// Styled Components
const ArrangementCard = styled(Card)`
  background: ${({ theme }) => theme.colors.card};
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 600px;

  @media (max-width: 768px) {
    height: 500px;
  }
`;

const Header = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TemplateSelector = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md};
`;

const SelectorButton = styled.button<{ $isOpen?: boolean }>`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg} ${theme.spacing.sm} ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: inherit;
  cursor: pointer;
  min-width: 220px;
  text-align: left;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  position: relative;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  margin-top: ${({ theme }) => theme.spacing.xs};
  z-index: 100;
  min-width: 360px;
  max-height: 420px;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.large};
`;

const CategoryHeader = styled.div<{ $color?: string }>`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.xs}`};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  color: ${({ $color }) => $color || '#666'};
  letter-spacing: 1.5px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  position: sticky;
  top: 0;
  z-index: 1;
`;

const TemplateOption = styled.button<{ $isSelected?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 20px`};
  background: ${({ theme, $isSelected }) =>
    $isSelected ? `${theme.colors.primary}22` : 'transparent'};
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}11`};
  }
`;

const SceneList = styled.div`
  flex: 1;
  overflow: auto;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
`;

const SceneItem = styled.div<{ $energy: number; $delay: number }>`
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme, $energy }) =>
    `${ENERGY_COLORS[$energy].fill}44`};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  animation: ${fadeSlideIn} 0.3s ease both;
  animation-delay: ${({ $delay }) => `${$delay}s`};
`;

const EnergyBar = styled.div<{ $energy: number; $delay: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: ${({ $energy }) => `${($energy / 4) * 100}%`};
  background: ${({ $energy }) =>
    `linear-gradient(90deg, ${ENERGY_COLORS[$energy].bg} 0%, ${ENERGY_COLORS[$energy].fill}88 60%, ${ENERGY_COLORS[$energy].clip}22 100%)`};
  border-right: ${({ $energy }) => `2px solid ${ENERGY_COLORS[$energy].clip}66`};
  animation: ${fillIn} 0.5s ease both;
  animation-delay: ${({ $delay }) => `${$delay}s`};
`;

const SceneContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: ${({ theme }) => `11px ${theme.spacing.md}`};
  gap: ${({ theme }) => theme.spacing.md};
`;

const EnergyArcContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
`;

const EnergyArcChart = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

// Helper functions
function getAllTemplates(): Record<string, Template> {
  const all: Record<string, Template> = {};
  CATEGORIES.forEach((cat) => {
    Object.entries(cat.templates).forEach(([name, tmpl]) => {
      all[name] = { ...tmpl, category: cat.label };
    });
  });
  return all;
}

const ALL_TEMPLATES = getAllTemplates();

const ArrangementTool: FC<ArrangementToolProps> = () => {
  const [selected, setSelected] = useState("Two Peaks");
  const [isOpen, setIsOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const template = ALL_TEMPLATES[selected];
  const totalBars = template.scenes.reduce((a, s) => a + s.bars, 0);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [selected]);

  return (
    <ArrangementCard>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CardIconWrapper>
            <Icon icon={FaMusic} />
          </CardIconWrapper>
          <CardTitle>Arrangement Tool</CardTitle>
        </div>
        <span style={{ fontSize: '10px', color: '#666' }}>v0.3</span>
      </Header>

      <TemplateSelector>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '9px', color: '#666', marginBottom: '5px', letterSpacing: '1px' }}>
              TEMPLATE
            </div>
            <div style={{ position: 'relative' }}>
              <SelectorButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '1px',
                  background: CATEGORY_COLORS[template.category || ''] || '#888',
                  flexShrink: 0
                }} />
                {selected}
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '8px',
                  color: '#666'
                }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </SelectorButton>

              {isOpen && (
                <Dropdown>
                  {CATEGORIES.map((cat) => (
                    <div key={cat.label}>
                      <CategoryHeader $color={CATEGORY_COLORS[cat.label]}>
                        {cat.label}
                      </CategoryHeader>
                      {Object.entries(cat.templates).map(([name, tmpl]) => (
                        <TemplateOption
                          key={name}
                          onClick={() => {
                            setSelected(name);
                            setIsOpen(false);
                          }}
                          $isSelected={name === selected}
                        >
                          <div style={{
                            display: 'flex',
                            gap: '1px',
                            alignItems: 'flex-end',
                            height: '14px',
                            flexShrink: 0,
                            width: '30px'
                          }}>
                            {tmpl.scenes.map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  flex: 1,
                                  height: `${(s.energy / 4) * 100}%`,
                                  background: ENERGY_COLORS[s.energy].clip,
                                  borderRadius: '1px',
                                  minHeight: '2px'
                                }}
                              />
                            ))}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '11px',
                              color: name === selected ? '#FF6A00' : '#CCC',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {name}
                            </div>
                            <div style={{
                              fontSize: '9px',
                              color: '#4A4A4A',
                              marginTop: '1px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {tmpl.vibe}
                            </div>
                          </div>
                        </TemplateOption>
                      ))}
                    </div>
                  ))}
                </Dropdown>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <div style={{ fontSize: '11px', color: '#999', lineHeight: 1.6 }}>
              {template.desc}
            </div>
            <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
              → {template.vibe}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#666', letterSpacing: '1px', marginBottom: '4px' }}>
                SCENES
              </div>
              <div style={{ fontSize: '20px', color: '#FF6A00', fontWeight: 700 }}>
                {template.scenes.length}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#666', letterSpacing: '1px', marginBottom: '4px' }}>
                BARS
              </div>
              <div style={{ fontSize: '20px', color: '#FF6A00', fontWeight: 700 }}>
                {totalBars}
              </div>
            </div>
          </div>
        </div>
      </TemplateSelector>

      <SceneList>
        <div key={animKey} style={{ display: 'flex', flexDirection: 'column' }}>
          {template.scenes.map((scene, si) => {
            const colors = ENERGY_COLORS[scene.energy];
            return (
              <SceneItem key={si} $energy={scene.energy} $delay={si * 0.04}>
                <EnergyBar $energy={scene.energy} $delay={si * 0.04 + 0.1} />
                <SceneContent>
                  <span style={{ fontSize: '9px', color: '#555', width: '16px', textAlign: 'right', flexShrink: 0 }}>
                    {si + 1}
                  </span>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    background: colors.clip,
                    flexShrink: 0,
                    boxShadow: `0 0 8px ${colors.clip}55`
                  }} />
                  <span style={{ fontSize: '13px', color: '#E0E0E0', fontWeight: 600, flex: 1 }}>
                    {scene.name}
                  </span>
                  <span style={{ fontSize: '10px', color: '#666', flexShrink: 0 }}>
                    {scene.bars} bars
                  </span>
                </SceneContent>
              </SceneItem>
            );
          })}
        </div>

        <EnergyArcContainer>
          <div style={{ fontSize: '9px', color: '#555', marginBottom: '8px', letterSpacing: '1px', paddingLeft: '2px' }}>
            ENERGY ARC
          </div>
          <EnergyArcChart>
            <div style={{ display: 'flex', gap: '2px', height: '40px', alignItems: 'flex-end' }}>
              {template.scenes.map((scene, i) => {
                const colors = ENERGY_COLORS[scene.energy];
                const widthPercent = (scene.bars / totalBars) * 100;
                const heightPercent = (scene.energy / 4) * 100;
                return (
                  <div
                    key={i}
                    style={{
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                      background: `linear-gradient(to top, ${colors.bg}, ${colors.clip})`,
                      borderRadius: '3px 3px 0 0',
                      animation: `${growUp} 0.5s ease both`,
                      animationDelay: `${i * 0.06}s`
                    }}
                    title={`${scene.name} — ${scene.bars} bars`}
                  />
                );
              })}
            </div>
          </EnergyArcChart>
        </EnergyArcContainer>
      </SceneList>
    </ArrangementCard>
  );
};

export default ArrangementTool;