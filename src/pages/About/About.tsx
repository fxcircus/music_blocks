import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaGithub, FaReact, FaNodeJs, FaIcons, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Container, Card, CardHeader, CardTitle, CardIconWrapper } from '../../components/common/StyledComponents';
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
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TipsSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const TipsHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}11`};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const TipsContent = styled(motion.div)`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
`;

const TipsItem = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:last-child {
    margin-bottom: 0;
  }
`;

const TipsTitle = styled.h4`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const TipsText = styled.p`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.xs};

  strong {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }

  em {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const AboutPage = () => {
  const [showTips, setShowTips] = useState(false);
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
             <StyledLink href="https://github.com/fxcircus/music-tools-studio" target="_blank" rel="noopener noreferrer">
              View the source code on GitHub <Icon icon={FaGithub} size={16} />
            </StyledLink>
          </Paragraph>
        </Section>
        
        <Section>
          <SectionTitle>Features</SectionTitle>
          <List>
            <ListItem>
              <Strong>🍅 Flow Timer:</Strong>
              <NestedList>
                <ListItem>A simple Pomodoro-style timer to help you stay focused while writing, practicing, or producing.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong>🎲 Inspiration Generator:</Strong>
              <NestedList>
                <ListItem>Randomize scales, BPM, and sounds. Lock in what you like and shuffle the rest.</ListItem>
                <ListItem>Interactive chord degrees with highlighting and seventh chord support.</ListItem>
                <ListItem>Visual piano and guitar displays showing scale notes and chord tones.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong>🎶 Metronome:</Strong>
              <NestedList>
                <ListItem>Follows the BPM from the Inspiration Generator, with manual adjustment in 1-step increments.</ListItem>
                <ListItem>Click the dial to jump to specific BPM values.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong>🎸 Varispeed Calculator:</Strong>
              <NestedList>
                <ListItem>Calculate pitch shifts for varispeed recording and tape manipulation.</ListItem>
                <ListItem>Shows BPM changes when recording at different pitches.</ListItem>
                <ListItem>Perfect for analog and digital recording workflows.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong>📊 Arranger:</Strong>
              <NestedList>
                <ListItem>Visual song structure builder with draggable sections.</ListItem>
                <ListItem>Create arrangements using Intro, Verse, Chorus, Bridge, and Outro blocks.</ListItem>
                <ListItem>Perfect for planning song structures and arrangements.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong>📝 Notes:</Strong>
              <NestedList>
                <ListItem>Write down lyrics, chord progressions, FX pedal settings, etc...</ListItem>
                <ListItem>Auto-saves locally as you type.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong>❓ Contextual Help:</Strong>
              <NestedList>
                <ListItem>Hover over any block to reveal a help button with tips and instructions.</ListItem>
                <ListItem>Clean interface that shows help only when needed.</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong>🔗 Share Your Work:</Strong>
              <NestedList>
                <ListItem>Copy a URL with your current settings — perfect for saving or sharing.</ListItem>
                <ListItem>(Export/import via JSON is still in the code, just commented out.)</ListItem>
              </NestedList>
            </ListItem>
            <ListItem>
              <Strong>🌓 Dark / Light Modes:</Strong>
              <NestedList>
                <ListItem>Full theme support with carefully crafted dark and light modes.</ListItem>
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
              <IconContainer>🔀</IconContainer>
              Framer Motion
            </TechItem>
            <TechItem>
              <IconContainer><Icon icon={FaNodeJs} size={16} /></IconContainer>
              Node.js
            </TechItem>
            <TechItem>
              <IconContainer><Icon icon={FaIcons} size={16} /></IconContainer>
              React Icons
            </TechItem>
          </TechList>
          <Paragraph style={{ marginTop: '1rem' }}>
            <StyledLink href="https://www.npmjs.com/package/tone" target="_blank" rel="noopener noreferrer">
              Tone.js
            </StyledLink> Audio engine for the metronome.
          </Paragraph>
          <Paragraph>
            <StyledLink href="https://react-icons.github.io/react-icons/" target="_blank" rel="noopener noreferrer">
              React Icons
            </StyledLink> providing Font Awesome, Game Icons and more icon collections.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>Tips & Tricks</SectionTitle>
          <TipsSection>
            <TipsHeader onClick={() => setShowTips(!showTips)}>
              <span>View tips for using each block</span>
              <Icon icon={showTips ? FaChevronUp : FaChevronDown} size={20} />
            </TipsHeader>

            {showTips && (
              <TipsContent
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TipsItem>
                  <TipsTitle>
                    <span>🍅</span> Flow Timer
                  </TipsTitle>
                  <TipsText>
                    This timer follows the Pomodoro technique.
                  </TipsText>
                  <TipsText>
                    Work in focused intervals (typically 25 minutes), then take a short break.
                  </TipsText>
                  <TipsText>
                    After several work sessions, take a longer break.
                  </TipsText>
                  <TipsText>
                    Use the timer to structure focused deep work sessions.
                  </TipsText>
                </TipsItem>

                <TipsItem>
                  <TipsTitle>
                    <span>🎲</span> Inspiration Generator
                  </TipsTitle>
                  <TipsText>
                    Click on the dice to "roll" a new set of "rules".
                  </TipsText>
                  <TipsText>
                    When you find a setting you like, click on the lock icon to keep it locked, then continue rolling to randomize the other unlocked parameters.
                  </TipsText>
                  <TipsText>
                    Click on the chord degrees to highlight the different notes from the scale that form each chord.
                  </TipsText>
                  <TipsText>
                    Click on the icon next to "Chord Degrees" to switch between triads and seventh chords.
                  </TipsText>
                </TipsItem>

                <TipsItem>
                  <TipsTitle>
                    <span>🎶</span> Metronome
                  </TipsTitle>
                  <TipsText>
                    You can click directly on the metronome dial to start or stop playback.
                  </TipsText>
                  <TipsText>
                    Use the + and – controls to adjust BPM.
                  </TipsText>
                  <TipsText>
                    The metronome will play at the currently displayed tempo.
                  </TipsText>
                </TipsItem>

                <TipsItem>
                  <TipsTitle>
                    <span>🎸</span> Varispeed Calculator
                  </TipsTitle>
                  <TipsText>
                    <strong>To pitch down:</strong> Set your DAW to the target BPM (faster), record your part, then slow playback to your original BPM.
                  </TipsText>
                  <TipsText>
                    <strong>To pitch up:</strong> Set your DAW to the target BPM (slower), record your part, then speed playback to your original BPM.
                  </TipsText>
                  <TipsText>
                    <em>Each semitone ≈ 5.95% speed change.</em>
                  </TipsText>
                </TipsItem>

                <TipsItem>
                  <TipsTitle>
                    <span>📊</span> Arranger
                  </TipsTitle>
                  <TipsText>
                    Drag and drop sections to create your song structure.
                  </TipsText>
                  <TipsText>
                    Use the preset arrangements for common song structures or create your own.
                  </TipsText>
                  <TipsText>
                    Each section type (Intro, Verse, Chorus, etc.) has its own color for easy visualization.
                  </TipsText>
                </TipsItem>

                <TipsItem>
                  <TipsTitle>
                    <span>📝</span> Notes
                  </TipsTitle>
                  <TipsText>
                    Your notes auto-save as you type, so you never lose your ideas.
                  </TipsText>
                  <TipsText>
                    Use this space for lyrics, chord progressions, equipment settings, or any other creative notes.
                  </TipsText>
                  <TipsText>
                    Notes persist between sessions using browser local storage.
                  </TipsText>
                </TipsItem>
              </TipsContent>
            )}
          </TipsSection>
        </Section>
      </AboutCard>
    </AboutContainer>
  );
};

export default AboutPage;
