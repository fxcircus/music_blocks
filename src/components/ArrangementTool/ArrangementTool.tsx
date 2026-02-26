import React, { useState, useEffect, FC } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaChartBar } from 'react-icons/fa';
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
      "Call & Response": {
        desc: "Alternates full and stripped. Contrast IS the arrangement.",
        vibe: "Funk, disco, UK garage, dance with breakdowns",
        scenes: [
          { name: "Intro", bars: 8, energy: 1 },
          { name: "Full", bars: 8, energy: 4 },
          { name: "Strip", bars: 8, energy: 2 },
          { name: "Full+", bars: 8, energy: 4 },
          { name: "Strip 2", bars: 8, energy: 2 },
          { name: "Full++", bars: 16, energy: 4 },
          { name: "Bridge", bars: 8, energy: 3 },
          { name: "Full+++", bars: 8, energy: 4 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
      "The Minimalist": {
        desc: "Two ideas alternate, then combine. That's the whole song.",
        vibe: "Minimal techno, Four Tet, ambient, instrumental",
        scenes: [
          { name: "A", bars: 16, energy: 2 },
          { name: "B", bars: 16, energy: 2 },
          { name: "A", bars: 16, energy: 2 },
          { name: "B", bars: 16, energy: 2 },
          { name: "A + B", bars: 16, energy: 4 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
      "The Epic": {
        desc: "Multiple movements. Not one peak — a journey.",
        vibe: "Post-rock, progressive, film score, Godspeed/Mogwai",
        scenes: [
          { name: "Intro", bars: 16, energy: 1 },
          { name: "Movement 1", bars: 32, energy: 2 },
          { name: "Transition", bars: 8, energy: 1 },
          { name: "Movement 2", bars: 32, energy: 3 },
          { name: "Climax", bars: 16, energy: 4 },
          { name: "Outro", bars: 16, energy: 1 },
        ],
      },
      "Peak & Dissolve": {
        desc: "Builds to center, then deconstructs beautifully.",
        vibe: "James Blake, Bon Iver, experimental R&B",
        scenes: [
          { name: "Intro", bars: 8, energy: 1 },
          { name: "Build", bars: 16, energy: 2 },
          { name: "Peak", bars: 16, energy: 4 },
          { name: "Deconstruct", bars: 16, energy: 3 },
          { name: "Ghost", bars: 8, energy: 1 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
      "The Fake Out": {
        desc: "Predictable first half so the beat switch hits harder.",
        vibe: "Tyler the Creator, Radiohead, Frank Ocean",
        scenes: [
          { name: "Intro", bars: 8, energy: 2 },
          { name: "A", bars: 16, energy: 2 },
          { name: "A repeat", bars: 16, energy: 2 },
          { name: "Break", bars: 4, energy: 1 },
          { name: "B — New Energy", bars: 16, energy: 4 },
          { name: "B+", bars: 16, energy: 4 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
    },
  },
  {
    label: "BEATLES",
    templates: {
      "AABA Middle Eight": {
        desc: "Pre-Beatles pop form they perfected. No chorus — the verse IS the hook, with a contrasting bridge (middle eight) for relief. Refrain line at end of each verse carries the title.",
        vibe: "She Loves You, I Want to Hold Your Hand, From Me to You, Yesterday",
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
        desc: "Chorus in the first 20 seconds. Everything in under 3 minutes. No wasted bars. The streaming era before streaming existed — every section earns its place.",
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
      "Through-Composed": {
        desc: "Nothing repeats. Distinct movements stitched together — each section a different song glued by mood and key. The song keeps moving forward, never looking back.",
        vibe: "A Day in the Life, Happiness is a Warm Gun, Golden Slumbers medley",
        scenes: [
          { name: "Part I — Gentle", bars: 16, energy: 2 },
          { name: "Orchestral Build", bars: 8, energy: 3 },
          { name: "Part II — New Feel", bars: 16, energy: 3 },
          { name: "Chaos / Crescendo", bars: 8, energy: 4 },
          { name: "Part III — Resolution", bars: 12, energy: 2 },
          { name: "Final Crescendo", bars: 4, energy: 4 },
        ],
      },
    },
  },
  {
    label: "PINK FLOYD",
    templates: {
      "Textural Expansion": {
        desc: "A tiny amount of harmonic material stretched over enormous duration through arrangement, texture, and studio craft. The chords barely change — everything else does. Solos are structural pillars, not decoration.",
        vibe: "Dogs, Echoes, Sheep, Any Colour You Like",
        scenes: [
          { name: "Atmosphere", bars: 16, energy: 1 },
          { name: "Theme Emerges", bars: 16, energy: 2 },
          { name: "Theme Develops", bars: 16, energy: 2 },
          { name: "Solo as Architecture", bars: 16, energy: 3 },
          { name: "Theme Expanded", bars: 16, energy: 3 },
          { name: "Interlude / Breakdown", bars: 16, energy: 1 },
          { name: "Theme Transformed", bars: 16, energy: 4 },
          { name: "Dissolve", bars: 16, energy: 1 },
        ],
      },
      "Sound → Song → Sound": {
        desc: "Song emerges out of pure atmosphere, lives briefly as a recognizable structure, then dissolves back into soundscape. The 'song' part is almost incidental — the journey in and out is the real composition.",
        vibe: "Shine On You Crazy Diamond, Atom Heart Mother, Welcome to the Machine",
        scenes: [
          { name: "Soundscape Intro", bars: 32, energy: 1 },
          { name: "Song Emerges", bars: 16, energy: 2 },
          { name: "Verse", bars: 16, energy: 2 },
          { name: "Chorus / Refrain", bars: 8, energy: 3 },
          { name: "Extended Solo", bars: 16, energy: 3 },
          { name: "Reprise", bars: 8, energy: 2 },
          { name: "Dissolve to Soundscape", bars: 24, energy: 1 },
        ],
      },
      "The Slow Boil": {
        desc: "Starts quiet and barely there. Tension accumulates through repetition and layering until the release is almost physical. The famous Pink Floyd build — patience rewarded with catharsis.",
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
  {
    label: "NEIL YOUNG",
    templates: {
      "The Long Jam": {
        desc: "Dead simple structure — verse, chorus, done. But between them, enormous extended guitar solos where the real emotional content lives. The vocal parts set up the jams. One chord can last 5 minutes and nobody cares.",
        vibe: "Down by the River, Cowgirl in the Sand, Like a Hurricane, Cortez the Killer",
        scenes: [
          { name: "Intro Riff", bars: 4, energy: 2 },
          { name: "Verse 1", bars: 8, energy: 2 },
          { name: "Chorus", bars: 4, energy: 3 },
          { name: "Extended Solo", bars: 24, energy: 4 },
          { name: "Verse 2", bars: 8, energy: 2 },
          { name: "Chorus", bars: 4, energy: 3 },
          { name: "Epic Solo — Let It Rip", bars: 32, energy: 4 },
          { name: "Verse 3", bars: 8, energy: 2 },
          { name: "Chorus → Fade", bars: 8, energy: 3 },
        ],
      },
      "Acoustic → Electric": {
        desc: "Starts fragile, acoustic, intimate — like a folk song. Then something breaks and the electric guitars arrive like a wall. Two halves of the same emotional truth. The transition is the moment.",
        vibe: "Hey Hey My My, Powderfinger, Rockin' in the Free World, Tonight's the Night",
        scenes: [
          { name: "Acoustic Intro", bars: 8, energy: 1 },
          { name: "Acoustic Verse 1", bars: 16, energy: 2 },
          { name: "Acoustic Chorus", bars: 8, energy: 2 },
          { name: "Acoustic Verse 2", bars: 16, energy: 2 },
          { name: "Silence / Transition", bars: 4, energy: 1 },
          { name: "Electric Explosion", bars: 8, energy: 4 },
          { name: "Electric Solo", bars: 16, energy: 4 },
          { name: "Electric Verse", bars: 8, energy: 3 },
          { name: "Electric Outro — Raw", bars: 8, energy: 4 },
        ],
      },
      "One-Take Rawness": {
        desc: "Feels like it was played once, straight through, and that take was the keeper. Minimal arrangement — just a band in a room. Mistakes stay in. Energy comes from commitment, not perfection.",
        vibe: "Cinnamon Girl, Ohio, My My Hey Hey, Sedan Delivery",
        scenes: [
          { name: "Count In / Riff", bars: 2, energy: 3 },
          { name: "Verse 1", bars: 8, energy: 3 },
          { name: "Chorus", bars: 4, energy: 4 },
          { name: "Verse 2", bars: 8, energy: 3 },
          { name: "Chorus", bars: 4, energy: 4 },
          { name: "Solo — One Note Fury", bars: 16, energy: 4 },
          { name: "Verse 3", bars: 8, energy: 3 },
          { name: "Chorus → End Cold", bars: 4, energy: 4 },
        ],
      },
    },
  },
  {
    label: "KING CRIMSON",
    templates: {
      "Ballad to Chaos": {
        desc: "Opens as a beautiful, restrained ballad. A repeating figure begins — innocent at first, then insistent, then obsessive. The song slowly devours itself. By the end it's unrecognizable from where it started.",
        vibe: "Starless, Epitaph, The Letters, Islands",
        scenes: [
          { name: "Ballad — Mellotron", bars: 16, energy: 1 },
          { name: "Vocal Section", bars: 16, energy: 2 },
          { name: "Solo — Lyrical", bars: 16, energy: 2 },
          { name: "Repeating Figure Begins", bars: 16, energy: 3 },
          { name: "Intensifying", bars: 16, energy: 3 },
          { name: "Breaking Point", bars: 8, energy: 4 },
          { name: "Explosion / Climax", bars: 16, energy: 4 },
          { name: "Sudden Stop", bars: 1, energy: 1 },
        ],
      },
      "Interlocking Machine": {
        desc: "Mathematically precise patterns that phase against each other. Feels mechanical yet alive. Patterns enter one by one, interlock, collide, and eventually achieve a terrifying unity.",
        vibe: "Discipline, Frame by Frame, Thela Hun Ginjeet, Elephant Talk",
        scenes: [
          { name: "Pattern A — Alone", bars: 8, energy: 2 },
          { name: "Pattern B Enters", bars: 8, energy: 2 },
          { name: "A + B Interlock", bars: 16, energy: 3 },
          { name: "Pattern C — Disrupts", bars: 8, energy: 3 },
          { name: "All Patterns", bars: 16, energy: 4 },
          { name: "Strip to B", bars: 8, energy: 2 },
          { name: "Rebuild", bars: 8, energy: 3 },
          { name: "Full Interlock + Solo", bars: 16, energy: 4 },
          { name: "Unravel", bars: 8, energy: 1 },
        ],
      },
      "Multi-Part Suite": {
        desc: "Distinct movements with dramatic contrasts — quiet/loud, melodic/dissonant, composed/improvised. Each section could be its own piece. Unified by recurring motifs that transform across movements.",
        vibe: "Larks' Tongues in Aspic, In the Court of the Crimson King, Lizard",
        scenes: [
          { name: "I — Percussion / Texture", bars: 16, energy: 2 },
          { name: "II — Melodic Theme", bars: 16, energy: 2 },
          { name: "III — Aggressive Riff", bars: 16, energy: 4 },
          { name: "IV — Quiet Improv", bars: 16, energy: 1 },
          { name: "V — Theme Returns", bars: 8, energy: 3 },
          { name: "VI — Full Ensemble", bars: 16, energy: 4 },
          { name: "VII — Coda", bars: 8, energy: 2 },
        ],
      },
    },
  },
  {
    label: "BRIAN ENO",
    templates: {
      "Generative Layers": {
        desc: "No structure in the traditional sense. Loops of different lengths phase against each other, creating ever-shifting combinations. Nothing repeats exactly. Density is the only arc — layers accumulate, then thin.",
        vibe: "Music for Airports 2/1, Discreet Music, Thursday Afternoon, Reflection",
        scenes: [
          { name: "Layer 1 — Alone", bars: 16, energy: 1 },
          { name: "Layer 2 Enters", bars: 16, energy: 1 },
          { name: "Layers Phase — New Combo", bars: 16, energy: 2 },
          { name: "Layer 3 — Peak Density", bars: 24, energy: 2 },
          { name: "Layer 1 Drops", bars: 16, energy: 2 },
          { name: "Layers Thin", bars: 16, energy: 1 },
          { name: "Near Silence", bars: 16, energy: 1 },
        ],
      },
      "Oblique Strategy": {
        desc: "Short, self-contained sections — each one a different texture or mood. Connected by feel, not by chord progression or melody. Like flipping through paintings in a gallery. Chance determines what comes next.",
        vibe: "Another Green World, Before and After Science, Taking Tiger Mountain",
        scenes: [
          { name: "Texture A — Warm", bars: 8, energy: 1 },
          { name: "Melodic Fragment", bars: 8, energy: 2 },
          { name: "Texture B — Metallic", bars: 8, energy: 2 },
          { name: "Fragment Develops", bars: 8, energy: 2 },
          { name: "Unexpected Element", bars: 8, energy: 3 },
          { name: "Texture C — Sparse", bars: 8, energy: 1 },
          { name: "Return to A — Changed", bars: 8, energy: 2 },
          { name: "Fade / Evaporate", bars: 8, energy: 1 },
        ],
      },
      "Treated Studio": {
        desc: "Start with raw recorded material, then process and layer it. The arrangement isn't about adding instruments — it's about treating, warping, and spatializing what you already have. The studio is the instrument.",
        vibe: "Here Come the Warm Jets, My Life in the Bush of Ghosts, Nerve Net",
        scenes: [
          { name: "Raw Material — Dry", bars: 8, energy: 2 },
          { name: "Treatment Begins", bars: 8, energy: 2 },
          { name: "Processed — New Identity", bars: 16, energy: 3 },
          { name: "Vocal / Found Sound", bars: 8, energy: 3 },
          { name: "Full Treatment", bars: 16, energy: 4 },
          { name: "Strip — Original Returns", bars: 8, energy: 2 },
          { name: "Hybrid — Raw + Processed", bars: 16, energy: 3 },
          { name: "Dissolve", bars: 8, energy: 1 },
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
  overflow: visible;
  display: flex;
  flex-direction: column;
  height: 600px;
  position: relative;

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
  justify-content: center;
`;

const TemplateSelector = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md};
  position: relative;
  z-index: 10;
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
  top: calc(100% + 4px);
  left: 0;
  right: auto;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  z-index: 9999;
  width: 400px;
  max-width: 90vw;
  height: 400px;
  max-height: 60vh;
  overflow-y: scroll;
  overflow-x: hidden;
  box-shadow: ${({ theme }) => theme.shadows.large};

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background};
    border-radius: ${({ theme }) => theme.borderRadius.small};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.textSecondary};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    border: 2px solid ${({ theme }) => theme.colors.background};

    &:hover {
      background: ${({ theme }) => theme.colors.primary};
    }
  }
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
  overflow-y: auto;
  overflow-x: hidden;
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

const SceneEnergyBar = styled.div<{ $energy: number; $delay: number }>`
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

const ArcEnergyBar = styled.div<{ $width: number; $height: number; $delay: number; $bg: string; $clip: string }>`
  width: ${({ $width }) => `${$width}%`};
  height: ${({ $height }) => `${$height}%`};
  background: ${({ $bg, $clip }) => `linear-gradient(to top, ${$bg}, ${$clip})`};
  border-radius: 3px 3px 0 0;
  animation: ${growUp} 0.5s ease both;
  animation-delay: ${({ $delay }) => `${$delay}s`};
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
            <Icon icon={FaChartBar} />
          </CardIconWrapper>
          <CardTitle>Arrangement</CardTitle>
        </div>
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
                SECTIONS
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
                <SceneEnergyBar $energy={scene.energy} $delay={si * 0.04 + 0.1} />
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
                  <ArcEnergyBar
                    key={i}
                    $width={widthPercent}
                    $height={heightPercent}
                    $bg={colors.bg}
                    $clip={colors.clip}
                    $delay={i * 0.06}
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