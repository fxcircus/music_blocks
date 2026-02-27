import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

// Layout Components
export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.md};
`;

export const Card = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: 0;
  transition: all ${({ theme }) => theme.transitions.normal};
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.large};
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.sm};
    border-radius: ${({ theme }) => theme.borderRadius.small};
  }
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

// Typography
export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xxxl};
  font-weight: 700;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const Subtitle = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const Text = styled.p`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const SmallText = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

// Form Elements
export const Input = styled.input`
  background-color: ${({ theme }) => theme.colors.inputBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  width: 100%;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}33`};
  }
`;

export const TextArea = styled.textarea`
  background-color: ${({ theme }) => theme.colors.inputBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  padding: ${({ theme }) => theme.spacing.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  resize: vertical;
  min-height: 150px;
  width: 100%;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}33`};
  }
`;

export const Select = styled.select`
  background-color: ${({ theme }) => theme.colors.inputBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  width: 100%;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}33`};
  }
`;

// Button
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export const Button = styled(motion.button)<ButtonProps>`
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  ${({ variant, theme }) => 
    variant === 'primary' && css`
      background: ${theme.colors.buttonPrimary};
      color: ${theme.colors.buttonText};
      border: none;
      &:hover {
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.medium};
      }
      &:active {
        transform: translateY(0);
      }
    `
  }
  
  ${({ variant, theme }) => 
    variant === 'secondary' && css`
      background: ${theme.colors.buttonSecondary};
      color: ${theme.colors.buttonText};
      border: none;
      &:hover {
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.medium};
      }
      &:active {
        transform: translateY(0);
      }
    `
  }
  
  ${({ variant, theme }) => 
    variant === 'ghost' && css`
      background: transparent;
      color: ${theme.colors.primary};
      border: 1px solid ${theme.colors.primary};
      &:hover {
        background: ${theme.colors.primary}11;
      }
      &:active {
        background: ${theme.colors.primary}22;
      }
    `
  }
  
  ${({ size, theme }) => 
    size === 'small' && css`
      font-size: ${theme.fontSizes.sm};
      padding: ${theme.spacing.xs} ${theme.spacing.sm};
    `
  }
  
  ${({ size, theme }) => 
    size === 'medium' && css`
      font-size: ${theme.fontSizes.md};
      padding: ${theme.spacing.sm} ${theme.spacing.md};
    `
  }
  
  ${({ size, theme }) => 
    size === 'large' && css`
      font-size: ${theme.fontSizes.lg};
      padding: ${theme.spacing.md} ${theme.spacing.lg};
    `
  }
`;

Button.defaultProps = {
  variant: 'primary',
  size: 'medium',
};

// IconButton
export const IconButton = styled(motion.button)`
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  padding: ${({ theme }) => theme.spacing.xs};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// Timer specific components
export const TimerDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.timerBackground};
  border: 4px solid ${({ theme }) => theme.colors.timerBorder};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.timer};
  font-weight: 700;
  height: 180px;
  width: 180px;
  margin: 0 auto;
  transition: all ${({ theme }) => theme.transitions.normal};
`;

export const TimerControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

export const ControlButton = styled(IconButton)`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  color: ${({ theme }) => theme.colors.primary};
  
  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

// LockIcon
interface LockIconProps {
  $isLocked: boolean;
}

export const LockIcon = styled.i<LockIconProps>`
  color: ${({ $isLocked, theme }) => 
    $isLocked 
      ? theme.colors.lockIconActive 
      : theme.colors.lockIconInactive
  };
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    transform: scale(1.2);
  }
`;

// DiceButton for the Inspiration Generator
export const DiceButton = styled(motion.i)`
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.xxxl};
  margin: ${({ theme }) => theme.spacing.md} 0;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
    transform: scale(1.1);
  }
`;

// Table Components for Inspiration Generator
export const StyledTable = styled.table`
  width: 100%;
  border-spacing: 0;
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

export const TableHeader = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
`;

export const TableCell = styled.td`
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const ValueCell = styled(TableCell)`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

// Dark mode toggle
export const ThemeToggle = styled(motion.button)`
  background: transparent;
  border: none;
  cursor: pointer;
  position: fixed;
  bottom: ${({ theme }) => theme.spacing.lg};
  right: ${({ theme }) => theme.spacing.lg};
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.text};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    transform: scale(1.1);
  }
`;

// Main app wrapper with theme background
export const AppWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  color: ${({ theme }) => theme.colors.text};
  transition: all ${({ theme }) => theme.transitions.normal};
  font-family: 'Inter', 'Roboto', sans-serif;
  padding-top: 70px; /* Space for fixed navbar */
`;

// Create a consistent header component for all cards
export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  
  @media (max-width: 768px) {
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }
`;

export const CardTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  margin: 0;
  text-align: center;
`;

export const CardIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  margin-right: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;