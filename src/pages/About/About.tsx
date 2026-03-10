import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaGithub, FaReact, FaIcons, FaWaveSquare, FaChartBar, FaLink, FaQuestionCircle } from 'react-icons/fa';
import { GiTomato, GiMetronome } from 'react-icons/gi';
import { IoMdDocument } from 'react-icons/io';
import { MdDarkMode, MdAutoAwesome } from 'react-icons/md';
import { Container, Card, CardHeader, CardTitle } from '../../components/common/StyledComponents';
import { Icon } from '../../utils/IconHelper';

const AboutContainer = styled(Container)`
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.xxl}`};
  max-width: 900px;
  
  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.xl}`};
  }
`;

const AboutCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Logo = styled.img`
  max-height: 100px;
  border: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.xs};
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary}33;
`;

const Paragraph = styled.p`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const List = styled.ul`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.lg};
`;

const ListItem = styled.li`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const NestedList = styled.ul`
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding-left: ${({ theme }) => theme.spacing.lg};
`;

const StyledLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-weight: 500;
  
  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
    text-decoration: underline;
  }
`;

const Strong = styled.strong`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const TechList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TechItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background-color: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  box-shadow: ${({ theme }) => theme.shadows.small};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const IconContainer = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  margin-right: 4px;
`;

const AboutPage = () => {
  return (
    <AboutContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AboutCard>
        <CardHeader>
          <CardTitle>Blocks</CardTitle>
        </CardHeader>

        <LogoContainer>
          <Logo src={process.env.PUBLIC_URL + '/logo_2025.png'} alt="Blocks Logo" />
        </LogoContainer>
        
        <Section>
          <Paragraph style={{ textAlign: 'center' }}>
            Tools for creative flow
          </Paragraph>
          <Paragraph style={{ textAlign: 'center' }}>
            Each block is a different tool designed to help musicians get inspired, jot down ideas, get unstuck, and share what they're working on with friends.
          </Paragraph>
          <Paragraph style={{ textAlign: 'center' }}>
             <StyledLink href="https://github.com/fxcircus/music_blocks" target="_blank" rel="noopener noreferrer">
              View the source code on GitHub <Icon icon={FaGithub} size={16} />
            </StyledLink>
          </Paragraph>
        </Section>
        
        <Section>
          <SectionTitle>Features</SectionTitle>
          <List>
            <ListItem>
              <Strong><IconContainer><Icon icon={GiTomato} size={16} /></IconContainer> Flow Timer:</Strong>
              <NestedList>
                <ListItem>A feature-rich Pomodoro timer with 25-minute focus sessions, 5-minute breaks, and 15-minute long breaks (all customizable).</ListItem>
                <ListItem>Automatic session cycling through 4 work-break sequences with visual progress dots and a dynamic color-changing progress ring.</ListItem>
                <ListItem>Distinct audio cues for work completion, break completion, and full cycle completion. All settings persist in the browser.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong><IconContainer><Icon icon={MdAutoAwesome} size={16} /></IconContainer> Inspiration Generator:</Strong>
              <NestedList>
                <ListItem>Randomize scales, BPM, and sounds. Lock in what you like and shuffle the rest.</ListItem>
                <ListItem>Interactive chord degrees with highlighting and seventh chord support.</ListItem>
                <ListItem>Visual piano and guitar displays showing scale notes and chord tones.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong><IconContainer><Icon icon={GiMetronome} size={16} /></IconContainer> Metronome:</Strong>
              <NestedList>
                <ListItem>Follows the BPM from the Inspiration Generator, with manual adjustment in 1-step increments.</ListItem>
                <ListItem>Click the dial to jump to specific BPM values.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong><IconContainer><Icon icon={FaWaveSquare} size={16} /></IconContainer> Varispeed Calculator:</Strong>
              <NestedList>
                <ListItem>Calculate pitch shifts for varispeed recording and tape manipulation.</ListItem>
                <ListItem>Shows BPM changes when recording at different pitches.</ListItem>
                <ListItem>Perfect for analog and digital recording workflows.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong><IconContainer><Icon icon={FaChartBar} size={16} /></IconContainer> Arranger:</Strong>
              <NestedList>
                <ListItem>Visual song structure builder with draggable sections.</ListItem>
                <ListItem>Create arrangements using Intro, Verse, Chorus, Bridge, and Outro blocks.</ListItem>
                <ListItem>Perfect for planning song structures and arrangements.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong><IconContainer><Icon icon={IoMdDocument} size={16} /></IconContainer> Notes:</Strong>
              <NestedList>
                <ListItem>Notion-like WYSIWYG editor with slash commands and auto-formatting.</ListItem>
                <ListItem>Pre-built templates for lyrics, chord charts, pedal settings, mix notes, and more.</ListItem>
                <ListItem>Auto-saves locally as you type.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong><IconContainer><Icon icon={FaQuestionCircle} size={16} /></IconContainer> Contextual Help:</Strong>
              <NestedList>
                <ListItem>Hover over any block to reveal a help button with tips and instructions.</ListItem>
                <ListItem>Clean interface that shows help only when needed.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong><IconContainer><Icon icon={FaLink} size={16} /></IconContainer> Share Your Work:</Strong>
              <NestedList>
                <ListItem>Copy a compressed URL with your full project state — settings, notes, block layout, everything.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong><IconContainer><Icon icon={MdDarkMode} size={16} /></IconContainer> 6 Music-Inspired Themes:</Strong>
              <NestedList>
                <ListItem>Choose from Dark, Indie (TASCAM 424), Hip Hop (TR-808), Disco (neon nightclub), Vintage (Fender Tweed), and Light — each with its own colors, fonts, icon style, and instrument sounds.</ListItem>
                <ListItem>Mix and match using the speaker icon in the navbar — pair any theme's look with another theme's sound.</ListItem>
              </NestedList>
            </ListItem>
          </List>
        </Section>
        
        <Section>
          <SectionTitle>Technologies Used</SectionTitle>
          <TechList>
            <TechItem>
              <IconContainer><Icon icon={FaReact} size={16} /></IconContainer>
              React
            </TechItem>
            <TechItem>
              <IconContainer>TS</IconContainer>
              TypeScript
            </TechItem>
            <TechItem>
              <IconContainer>🎵</IconContainer>
              Tone.js
            </TechItem>
            <TechItem>
              <IconContainer>🔊</IconContainer>
              Web Audio API
            </TechItem>
            <TechItem>
              <IconContainer>✏️</IconContainer>
              TipTap
            </TechItem>
            <TechItem>
              <IconContainer>🔀</IconContainer>
              Framer Motion
            </TechItem>
            <TechItem>
              <IconContainer>🧲</IconContainer>
              dnd-kit
            </TechItem>
            <TechItem>
              <IconContainer>🎨</IconContainer>
              styled-components + Tailwind CSS
            </TechItem>
            <TechItem>
              <IconContainer>🔗</IconContainer>
              LZ-String
            </TechItem>
            <TechItem>
              <IconContainer><Icon icon={FaIcons} size={16} /></IconContainer>
              React Icons
            </TechItem>
          </TechList>
        </Section>

      </AboutCard>
    </AboutContainer>
  );
};

export default AboutPage;
