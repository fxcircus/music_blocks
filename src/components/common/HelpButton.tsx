import React from 'react';
import styled from 'styled-components';
import { FaQuestionCircle } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';

interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

const StyledHelpButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: all ${({ theme }) => theme.transitions.fast};
  opacity: 0;

  /* Always visible on mobile/tablet (no hover available) */
  @media (max-width: 768px) {
    opacity: 1;
  }

  /* Show on parent hover or when focused */
  .tool-card:hover &,
  .inspiration-card:hover &,
  .varispeed-card:hover &,
  .arrangement-card:hover &,
  &:focus {
    opacity: 1;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}22`};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
    opacity: 1;
  }
`;

const HelpButton: React.FC<HelpButtonProps> = ({ onClick, className }) => {
  return (
    <StyledHelpButton
      onClick={onClick}
      aria-label="Show help"
      title="Show help"
      className={className}
    >
      <Icon icon={FaQuestionCircle} size={16} />
    </StyledHelpButton>
  );
};

export default HelpButton;